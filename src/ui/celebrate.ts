/* Okno s odznakem. <dialog> otevřený přes showModal() je v top layer, takže
   je nad lepicí hlavičkou, lištou cookies i ikonou poradce webu bez ohledu
   na z-index a předky widgetu (A1, E12). Konfety jsou uvnitř dialogu.
   Po zavření jde fokus na první z tlačítek, která nahradila „Vyzvednout odznak“. */
import cs from '../content/cs.json';
import { badgeCount } from '../logic/state.ts';
import type { PathKey } from '../logic/types.ts';
import { fill } from '../logic/text.ts';
import type { Ctx } from './ctx.ts';
import { $, $$, el } from './dom.ts';
import { BADGE_ICON, THEME } from './icons.ts';

export interface Celebrate {
  readonly el: HTMLDialogElement;
  open(k: PathKey, returnTo: Element | null): void;
  /** focusBack = false při odchodu na jinou obrazovku, fokus pak řeší navigace. */
  close(focusBack?: boolean): void;
}

export function createCelebrate(ctx: Ctx): Celebrate {
  const t = cs.celebrate;
  const dlg = el<HTMLDialogElement>(`<dialog class="celebrate" id="cel" aria-labelledby="cel-title">
  <div class="cel-card" id="cel-card">
    <div class="cel-badge" id="cel-icon" aria-hidden="true"></div>
    <p class="cel-new">${t.new}</p>
    <h2 id="cel-title"></h2>
    <p class="cel-count" id="cel-count"></p>
    <div class="btn-row"><button class="btn btn-ghost" type="button" data-go="start">${t.more}</button><button class="btn btn-primary" type="button" data-go="vysledek">${t.result}</button></div>
    <button class="linkish cel-close" type="button" id="cel-close">${t.stay}</button>
  </div>
  <canvas class="confetti" id="confetti" aria-hidden="true" hidden></canvas>
</dialog>`);
  const card = $(dlg, '#cel-card'), cv = $<HTMLCanvasElement>(dlg, '#confetti');
  let returnTo: Element | null = null, focusBack = true, raf = 0;

  function confetti() {
    if (ctx.reduce) return;
    const cx = cv.getContext('2d');
    if (!cx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.hidden = false;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = ['#FABA20', '#69CCEA', '#E9225B', '#17496F', '#212529', '#FCF3D9'];
    const ps = Array.from({ length: 140 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.42, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 11 - 4,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: cols[Math.floor(Math.random() * cols.length)]!,
    }));
    const t0 = performance.now();
    const frame = (now: number) => {
      const el = now - t0;
      cx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.max(0, 1 - el / 1800); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
      }
      if (el < 1800) raf = requestAnimationFrame(frame);
      else stopConfetti();
    };
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }
  function stopConfetti() {
    cancelAnimationFrame(raf);
    cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height);
    cv.hidden = true;
  }

  const close = (back = true) => {
    if (!dlg.open) return;
    focusBack = back;
    dlg.close();
  };
  dlg.addEventListener('close', () => {
    stopConfetti();
    if (focusBack && returnTo) $$(returnTo, 'button').find(b => !b.hidden)?.focus({ preventScroll: true });
    focusBack = true;
  });
  $(dlg, '#cel-close').addEventListener('click', () => close());
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  // fokus drží uvnitř okna, aktivní prvek se čte ze shadow root (Z6)
  dlg.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $$(dlg, 'button, a[href]').filter(b => !b.hidden);
    if (!f.length) return;
    const i = f.indexOf(ctx.root.activeElement as HTMLElement);
    e.preventDefault();
    const next = i < 0 ? (e.shiftKey ? f.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + f.length) % f.length;
    f[next]!.focus();
  });

  return {
    el: dlg,
    open(k, back) {
      returnTo = back;
      card.className = 'cel-card ' + THEME[k];
      $(dlg, '#cel-icon').innerHTML = BADGE_ICON[k];
      $(dlg, '#cel-title').textContent = cs.paths[k].badge;
      const n = badgeCount(ctx.state);
      $(dlg, '#cel-count').textContent = n === 4 ? t.countAll : fill(t.count, { n });
      if (!dlg.open) dlg.showModal();
      $(dlg, '.btn-primary').focus();
      confetti();
    },
    close,
  };
}
