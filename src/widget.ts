/* Custom element <prace-na-zkousku>. Otevřený shadow root, vlastní stav místo
   hashe stránky, posluchače na shadow root, ne na document (Z6, A4).
   Atributy: data-variant (embed | standalone), data-start (start nebo klíč ukázky),
   data-scroll-offset (auto | číslo v px), data-ukazky (které ukázky nabízet, výchozí
   je config.offered). Z adresy stránky čte ?ukazka, které má přednost před data-start.
   Ukázka, která se nenabízí, se neotevře. Hash ani jiný stav hostitelské stránky
   nemění. */
import cs from './content/cs.json';
import config from './content/config.json';
import { createState, openPath } from './logic/state.ts';
import type { State } from './logic/state.ts';
import { PATHS } from './logic/types.ts';
import type { EntrySource, PathKey, Screen as Entry } from './logic/types.ts';
import { createAi } from './screens/ai.ts';
import { createData } from './screens/data.ts';
import { createGame } from './screens/game.ts';
import { createKyber } from './screens/kyber.ts';
import { createResult } from './screens/result.ts';
import { createStart } from './screens/start.ts';
import type { Ctx, Screen, Variant, View } from './ui/ctx.ts';
import { $, $$, el } from './ui/dom.ts';
import { otherCards } from './ui/parts.ts';
import { measureBottom, measureTop, resetPinnedCache, scrollPage } from './ui/scroll.ts';
import baseCss from './ui/styles.css?inline';
import screensCss from './ui/screens.css?inline';

/** Pruh Hotovo pod ukázkou. IT admin ho nemá, konec ukazuje výsledková karta v herním boxu. */
const DONE_BAR: Partial<Record<PathKey, string>> = { data: '#d-done', ai: '#a-done', hry: '#g-done' };
const SCREENS: Record<PathKey, (ctx: Ctx) => Screen> = { data: createData, ai: createAi, hry: createGame, kyber: createKyber };
/** Mezera nad prvkem nebo pod ním po posunu stránky, v px. */
const TOP_GAP = 8;

/** Nabízené ukázky v pořadí PATHS. Atribut slouží testům a pozdějšímu návratu schované ukázky, jinak platí config.offered. */
function readOffered(attr: string | undefined): readonly PathKey[] {
  const list = (attr ?? '').split(/[\s,]+/);
  const picked = PATHS.filter(k => list.includes(k));
  return picked.length ? picked : PATHS.filter(k => config.offered.includes(k));
}

let sharedSheet: CSSStyleSheet | null = null;
function adoptStyles(root: ShadowRoot) {
  const css = baseCss + '\n' + screensCss;
  if ('adoptedStyleSheets' in Document.prototype && 'replaceSync' in CSSStyleSheet.prototype) {
    if (!sharedSheet) {
      sharedSheet = new CSSStyleSheet();
      sharedSheet.replaceSync(css);
    }
    root.adoptedStyleSheets = [sharedSheet];
  } else {
    const style = document.createElement('style');
    style.textContent = css;
    root.appendChild(style);
  }
}

/** ?ukazka z odkazu v reklamě má přednost před data-start na stránce kurzu. */
function readEntry(attr: string | undefined, offered: readonly PathKey[]): { entry: Entry; source: EntrySource } {
  const isOffered = (v: string | undefined): v is PathKey => (offered as readonly (string | undefined)[]).includes(v);
  const fromUrl = new URLSearchParams(location.search).get('ukazka') ?? '';
  if (isOffered(fromUrl)) return { entry: fromUrl, source: 'url' };
  if (isOffered(attr)) return { entry: attr, source: 'attr' };
  return { entry: 'start', source: 'default' };
}

export class PraceNaZkousku extends HTMLElement {
  #root: ShadowRoot | null = null;
  #state!: State;
  #variant: Variant = 'embed';
  #reduce = false;
  #view: View = 'start';
  #offered: readonly PathKey[] = [];
  #views: readonly View[] = [];
  #screens!: Partial<Record<View, Screen>>;
  #progBox!: HTMLElement;
  #resizeFns = new Set<() => void>();
  #ro: ResizeObserver | null = null;
  #lastWidth = 0;
  #onWindowResize = () => {
    resetPinnedCache();
    this.#resizeFns.forEach(fn => fn());
  };

  connectedCallback() {
    if (!this.#root) this.#build();
    window.addEventListener('resize', this.#onWindowResize);
    this.#ro = new ResizeObserver(() => {
      const w = this.clientWidth;
      if (w === this.#lastWidth) return;
      this.#lastWidth = w;
      this.#resizeFns.forEach(fn => fn());
    });
    this.#ro.observe(this);
    this.#screens[this.#view]?.show?.();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.#onWindowResize);
    this.#ro?.disconnect();
    this.#screens[this.#view]?.hide?.();
  }

  /** Stav návštěvníka pro testy a pozdější odesílání (fáze 4). */
  get state(): State {
    return this.#state;
  }

  #build() {
    const root = (this.#root = this.attachShadow({ mode: 'open' }));
    adoptStyles(root);
    this.#variant = this.dataset.variant === 'standalone' ? 'standalone' : 'embed';
    this.#reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.#offered = readOffered(this.dataset.ukazky);
    this.#views = ['start', ...this.#offered, 'vysledek'];
    const { entry, source } = readEntry(this.dataset.start, this.#offered);
    this.#state = createState(entry, source, location.pathname);

    const ctx: Ctx = {
      host: this,
      root,
      state: this.#state,
      variant: this.#variant,
      offered: this.#offered,
      reduce: this.#reduce,
      today: new Date(),
      now: () => Date.now(),
      go: v => this.#go(v, true),
      completed: (k, first) => this.#completed(k, first),
      reveal: target => this.#reveal(target),
      alignTop: target => this.#alignTop(target),
      keepVisible: target => this.#keepVisible(target),
      topOffset: () => this.#topOffset(),
      bottomOffset: () => (this.#variant === 'embed' ? measureBottom(this) : 0),
      width: () => this.clientWidth,
      onResize: fn => {
        this.#resizeFns.add(fn);
        return () => this.#resizeFns.delete(fn);
      },
      wait: ms => new Promise(r => setTimeout(r, this.#reduce ? 0 : ms)),
    };

    const ui = cs.ui;
    const prog = '<button class="prog" type="button" data-go="vysledek">' + ui.myResult + '</button>';
    const top = this.#variant === 'standalone'
      ? '<header class="site"><div class="container site-in"><button class="logo" type="button" data-go="start" aria-label="' + ui.logoLabel + '"><span class="logo-mark" aria-hidden="true"><b>C</b><span>L</span></span><span class="tool-name">' + ui.toolName + '</span></button>' + prog + '</div></header>'
      : '<div class="pnz-bar"><div class="container">' + prog + '</div></div>';
    const wrap = el('<div class="pnz">' + top + '<main></main></div>');
    const main = $(wrap, 'main');
    this.#progBox = wrap.querySelector<HTMLElement>('.pnz-bar') ?? $(wrap, '.prog');

    this.#screens = { start: createStart(this.#offered), vysledek: createResult(ctx) };
    for (const k of this.#offered) this.#screens[k] = SCREENS[k](ctx);
    for (const v of this.#views) main.appendChild(this.#screens[v]!.el);
    root.append(wrap);

    root.addEventListener('click', e => {
      const t = e.target as Element;
      const go = t.closest<HTMLElement>('[data-go]');
      if (go) {
        e.preventDefault();
        this.#go(go.dataset.go as View, true);
      }
    });

    // první vykreslení stránkou neposouvá ani nebere fokus (V2-1)
    this.#go(entry, false);
  }

  #go(view: View, user: boolean) {
    if (!this.#views.includes(view)) view = 'start';
    const prev = this.#view;
    for (const v of this.#views) this.#screens[v]!.el.hidden = v !== view;
    if (prev !== view) this.#screens[prev]?.hide?.();
    if (view !== 'start' && view !== 'vysledek') openPath(this.#state, view, Date.now());
    this.#view = view;
    this.#renderProgress();
    this.#screens[view]?.show?.();
    if (!user) return;
    // widget na svůj začátek pod lepicí hlavičku webu, ne na začátek stránky
    const top = this.getBoundingClientRect().top, off = this.#topOffset();
    if (top < off) scrollPage(scrollY + top - off, false);
    this.#screens[view]?.heading?.focus({ preventScroll: true });
  }

  #completed(k: PathKey, reveal: boolean) {
    this.#renderProgress();
    const sel = DONE_BAR[k];
    if (!sel) return;
    const bar = $(this.#root!, sel);
    bar.hidden = false;
    if (reveal) setTimeout(() => this.#reveal(bar), 400);
  }

  #renderProgress() {
    const root = this.#root!, s = this.#state;
    // „Můj výsledek“ v hlavičce až ve chvíli, kdy je co ukázat. U IT admina vede dál „Co dál?“
    // na výsledkové kartě a druhé tlačítko by soupeřilo (rozhodnutí Ondřeje 12. 11.)
    this.#progBox.hidden = this.#view === 'kyber' || !this.#offered.some(k => s[k].status === 'done' || s[k].status === 'skipped');
    for (const box of $$(root, '[data-more]')) {
      box.innerHTML = otherCards(box.dataset.more as PathKey, this.#offered, s);
      box.parentElement!.hidden = !box.innerHTML;
    }
    for (const k of this.#offered) {
      const tag = $(root, '[data-state="' + k + '"]');
      const st = s[k].status;
      tag.className = st === 'done' ? 'state-done' : st === 'skipped' ? 'state-skip' : 'go';
      tag.textContent = st === 'done' ? cs.ui.done : st === 'skipped' ? cs.ui.skipped : cs.ui.try;
    }
  }

  #topOffset(): number {
    const attr = this.dataset.scrollOffset;
    if (attr && attr !== 'auto' && Number.isFinite(Number(attr))) return Number(attr);
    return this.#variant === 'standalone' ? 0 : measureTop(this);
  }

  /** Odkryje prvek, když je pod polovinou okna nebo schovaný pod lepicí hlavičkou (reveal() z prototypu). */
  #reveal(target: Element | null | undefined) {
    if (!target?.isConnected) return;
    const r = target.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const off = this.#topOffset();
    if (r.top > innerHeight * 0.55 || r.bottom < off + 80) scrollPage(scrollY + r.top - off, !this.#reduce);
  }

  #alignTop(target: Element | null | undefined) {
    if (!target?.isConnected) return;
    scrollPage(scrollY + target.getBoundingClientRect().top - this.#topOffset() - TOP_GAP, !this.#reduce);
  }

  #keepVisible(target: Element | null | undefined) {
    if (!target?.isConnected) return;
    const r = target.getBoundingClientRect();
    const limit = innerHeight - (this.#variant === 'embed' ? measureBottom(this) : 0);
    if (r.bottom <= limit) return;
    // začátek prvku se kvůli jeho konci nesmí dostat pod lepicí hlavičku
    scrollPage(scrollY + Math.min(r.bottom - limit + TOP_GAP, r.top - this.#topOffset() - TOP_GAP), !this.#reduce);
  }
}
