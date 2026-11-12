/* IT administrátor: noční velín na serveru pekárny Kvásek podle Martinova
   zadání UX (11. 11.) a schváleného návrhu NAVRH-KYBER-UX.md.

   Stavový automat: úvod, krok 1 až 3, výsledek (data-step na #s-stage).
   Kroky se skládají z taktů (BEATS) a každý takt má fáze zpráva, otázka,
   volby a zpětná vazba (data-phase na #s-step). Volby se ukážou a jdou
   zmáčknout až po celé Terezině zprávě a pauze 400 ms (UX-01). Chat má pevnou
   výšku a oblast kroku začíná pořád na stejném místě (UX-02).

   Pokusy útočníka, karty adres, výpis terminálu, procenta, hvězdy a čas berou
   čísla z jednoho stavu hry (logic/kyber.ts, UX-03). Čas a útok začnou až po
   „Začít zásah“ a při skryté záložce stojí (UX-05). Do stavu návštěvníka se
   zapisuje jen první dohrání, „Zahrát znovu“ se nepočítá. Události pro
   analytiku posílá ui/track.ts (UX-12). */
import cs from '../content/cs.json';
import { BANNER, PROMPT, commands } from '../content/fixtures.ts';
import type { CmdKey } from '../content/fixtures.ts';
import { ATTACKER, PCT, TRY_MS, addTry, attempts, clock, meterLevel, mistakes, newGame, seconds, stars } from '../logic/kyber.ts';
import type { KyberGame } from '../logic/kyber.ts';
import { finish, kyberAnswer, touch } from '../logic/state.ts';
import { fill, nf } from '../logic/text.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, $$, el, esc } from '../ui/dom.ts';
import { STAR_ICON } from '../ui/icons.ts';
import { duration, moreSection, viewHead } from '../ui/parts.ts';
import { track } from '../ui/track.ts';
import type { TrackData, TrackEvent } from '../ui/track.ts';

type Phase = 'message' | 'question' | 'choices' | 'feedback';
type Labeled = keyof typeof cs.kyber.cmd;
type Step = 1 | 2 | 3;
/** Takt kroku: Terezina zpráva, pokyn nebo otázka a jedna akce, volba z karet nebo štíty. */
interface Beat { step: Step; say?: string; ask?: string; cmd?: Labeled; pick?: 'ip' | 'account'; shields?: true }
interface Packet { t: number; from: number; back: boolean }

/** Pauza mezi zprávou a otázkou (UX-01), mezi otázkou a volbami, na přečtení shrnutí, zvýraznění výpisu (UX-06) a před výsledkem, v ms. */
const PAUSE_MS = 400, ASK_MS = 250, READ_MS = 1200, FLASH_MS = 1500, RESULT_MS = 900;
/** Jak dlouho Tereza píše, podle délky zprávy. */
const typing = (text: string) => Math.min(1300, Math.max(500, text.length * 9));
/** Mapa: útočník, dva běžní uživatelé a server. */
const SOURCES = [{ x: 46, y: 34 }, { x: 46, y: 118 }, { x: 354, y: 34 }];
const SERVER = { x: 210, y: 76 };
const RING = 38;
const CHECK = '<svg class="i-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CROSS = '<svg class="i-no" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
const INFO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><path d="M12 7.4v.2"/></svg>';

export function createKyber(ctx: Ctx): Screen {
  const t = cs.kyber, r = t.result, s = ctx.state;
  const BEATS: Beat[] = [
    { step: 1, say: t.hello, ask: t.start, cmd: 'grep' },
    { step: 1, ask: t.countAsk, cmd: 'count' },
    { step: 1, ask: t.q1, pick: 'ip' },
    { step: 2, say: t.block, cmd: 'ufw' },
    { step: 2, say: t.last, cmd: 'last' },
    { step: 2, say: t.q2Say, ask: t.q2, pick: 'account' },
    { step: 3, ask: t.q3, shields: true },
  ];
  const root = el(`<section class="view t-sec" id="v-kyber" hidden><div class="container">
  ${viewHead('kyber', duration('kyber'), t.title, t.sub)}
  <div class="noc" id="s-stage" data-scene="intro" data-step="intro">
    <div class="noc-play" id="s-play" inert>
      <div class="noc-hud">
        <div class="noc-tile noc-tile-meter"><span>${t.hud.meter} <b class="noc-pct" id="s-pct"></b></span><div class="noc-meter" aria-hidden="true"><i id="s-meter"></i></div></div>
        <div class="noc-tile"><span>${t.hud.time}</span><b id="s-time">0:00</b></div>
        <div class="noc-tile"><span>${t.hud.tries}</span><b id="s-tries"></b></div>
        <div class="noc-tile"><span>${t.hud.stars}</span><b class="noc-hstars" id="s-stars"></b></div>
      </div>
      <div class="noc-grid" id="s-grid">
        <div class="noc-main">
          <div class="noc-chat" id="s-chat" role="log" aria-live="polite"></div>
          <div class="noc-step" id="s-step" tabindex="-1" data-phase="message"></div>
          <p class="sr" id="s-live" aria-live="polite"></p>
        </div>
        <div class="noc-side">
          <div class="noc-mapbox">
            <svg class="noc-map" id="s-map" viewBox="0 0 400 150" role="img" aria-label="${t.mapLabel}"></svg>
            <ul class="noc-legend"><li><i class="lg-att"></i>${t.legend.attacker}</li><li><i class="lg-usr"></i>${t.legend.users}</li><li><i class="lg-srv"></i>${t.legend.server}</li></ul>
          </div>
          <div class="noc-termbox" id="s-termbox">
            <button class="noc-term-toggle" type="button" id="s-term-toggle" aria-expanded="true" aria-controls="s-out">${t.terminal}</button>
            <div class="noc-term" id="s-out"></div>
          </div>
        </div>
      </div>
      <div class="noc-result" id="s-result" hidden></div>
    </div>
    <div class="noc-intro" id="s-intro">
      <div class="noc-intro-in">
        <p class="ptag">${t.intro.tag}</p>
        <h3>${t.intro.title}</h3>
        <p>${t.intro.text}</p>
        <button class="btn btn-primary noc-start" type="button" id="s-start">${t.intro.start}</button>
        <ul class="noc-rules">${t.intro.stars.map(x => '<li>' + STAR_ICON + x + '</li>').join('')}</ul>
      </div>
    </div>
  </div>
  ${moreSection('kyber')}
</div></section>`);
  const stage = $(root, '#s-stage'), play = $(root, '#s-play'), grid = $(root, '#s-grid'), intro = $(root, '#s-intro'), result = $(root, '#s-result');
  const chat = $(root, '#s-chat'), stepEl = $(root, '#s-step'), live = $(root, '#s-live'), out = $(root, '#s-out'), map = $(root, '#s-map');
  const meter = $(root, '#s-meter'), pctEl = $(root, '#s-pct'), timeEl = $(root, '#s-time'), triesEl = $(root, '#s-tries'), starsEl = $(root, '#s-stars');

  let g: KyberGame = newGame();
  let phase: Phase = 'message', beatAt = 0, gen = 0, firstRun = true, shown = false;
  let blocked = false, located = false, shields = 0, carried = '';
  let timer = 0, lastTick = 0, tryAcc = 0, raf = 0, lastFrame = 0, nextPacket = 0, shownStars = -1;
  let packets: Packet[] = [];
  const picked = new Set<string>();

  const send = (event: TrackEvent, data?: TrackData) => track(ctx.host, event, data);
  /** Herní události nesou i to, jestli jde o opakovanou hru, ať jde v analytice oddělit první hraní. */
  const sendPlay = (event: TrackEvent, data: TrackData = {}) => send(event, { ...data, replay: !firstRun });
  const inStage = () => stage.contains(ctx.root.activeElement);
  /** Fokus z tlačítka, které se vypne nebo zmizí, na oblast kroku, ať se neztratí (A11). */
  const holdFocus = () => { if (inStage()) stepEl.focus({ preventScroll: true }); };
  function announce(text: string) {
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = text; });
  }

  /* ---------- přehled nahoře ---------- */
  const starRow = (n: number) => [0, 1, 2].map(i => STAR_ICON.replace('<svg ', '<svg class="' + (i < n ? 'on' : 'off') + '" ')).join('');
  function paintHud() {
    meter.style.width = g.pct + '%';
    meter.className = meterLevel(g.pct);
    pctEl.textContent = fill(t.hud.meterValue, { n: g.pct });
    timeEl.textContent = clock(seconds(g));
    triesEl.textContent = nf(attempts(g));
    const n = stars(g);
    if (n === shownStars) return;
    shownStars = n;
    starsEl.innerHTML = starRow(n) + '<span>' + fill(r.stars, { n }) + '</span>';
  }

  /* ---------- čas a útok ---------- */
  function tick() {
    const now = performance.now(), dt = now - lastTick;
    lastTick = now;
    g.ms += dt;
    tryAcc += dt;
    for (; tryAcc >= TRY_MS; tryAcc -= TRY_MS) addTry(g);
    paintHud();
  }
  function resume() {
    if (timer || !g.started || g.finished || !shown || document.hidden) return;
    lastTick = performance.now();
    timer = window.setInterval(tick, 100);
    if (ctx.reduce) return;
    lastFrame = lastTick;
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    if (timer) {
      tick();
      clearInterval(timer);
      timer = 0;
    }
    cancelAnimationFrame(raf);
    raf = 0;
  }
  const onVisibility = () => (document.hidden ? pause() : resume());

  /* ---------- mapa útoku ---------- */
  function drawMap() {
    const color = g.finished ? '#2FA35A' : blocked ? '#FABA20' : '#D81B53';
    const ring = (rad: number, on: boolean, stroke: string) => !on ? '' :
      '<circle class="ring" cx="' + SERVER.x + '" cy="' + SERVER.y + '" r="' + rad + '" fill="none" stroke="' + stroke + '" stroke-width="3" stroke-dasharray="' + rad * 0.55 + ' ' + rad * 0.08 + '">' +
      (ctx.reduce ? '' : '<animateTransform attributeName="transform" type="rotate" from="0 ' + SERVER.x + ' ' + SERVER.y + '" to="360 ' + SERVER.x + ' ' + SERVER.y + '" dur="' + rad / 3 + 's" repeatCount="indefinite"/>') + '</circle>';
    let h = '';
    SOURCES.forEach((src, i) => {
      const att = i === 0, hot = att && !blocked;
      h += '<line x1="' + src.x + '" y1="' + src.y + '" x2="' + SERVER.x + '" y2="' + SERVER.y + '" stroke="#fff" stroke-opacity=".1" stroke-dasharray="3 5"/>';
      h += '<circle cx="' + src.x + '" cy="' + src.y + '" r="' + (att && located ? 10 : 7) + '" fill="' + (hot ? '#D81B53' : '#868E96') + '">' +
        (hot && g.started && !g.finished && !ctx.reduce ? '<animate attributeName="r" values="7;11;7" dur="1s" repeatCount="indefinite"/>' : '') + '</circle>';
      if (!att) return;
      if (located) h += '<circle cx="' + src.x + '" cy="' + src.y + '" r="16" fill="none" stroke="#FABA20" stroke-width="2"/>';
      h += '<text x="' + src.x + '" y="' + (src.y + 30) + '" text-anchor="middle" font-family="Ubuntu Mono, monospace" font-size="12" fill="' + (blocked || located ? '#FABA20' : '#FF8FA9') + '">' + (blocked ? t.mapBlocked : t.mapAttacker) + '</text>';
    });
    h += '<g id="s-packets"></g>';
    h += ring(RING, blocked, '#FABA20') + ring(RING + 9, shields >= 1, '#69CCEA') + ring(RING + 18, shields >= 2, '#2FA35A');
    h += '<rect x="' + (SERVER.x - 24) + '" y="' + (SERVER.y - 26) + '" width="48" height="52" rx="7" fill="#14171A" stroke="' + color + '" stroke-width="3"/>';
    for (let i = 0; i < 2; i++) {
      h += '<rect x="' + (SERVER.x - 17) + '" y="' + (SERVER.y + 4 + i * 10) + '" width="34" height="6" rx="2" fill="#343A40"/><circle cx="' + (SERVER.x + 12) + '" cy="' + (SERVER.y + 7 + i * 10) + '" r="2" fill="' + color + '"/>';
    }
    h += '<rect x="' + (SERVER.x - 17) + '" y="' + (SERVER.y - 20) + '" width="34" height="19" rx="3" fill="#FABA20"/><text x="' + SERVER.x + '" y="' + (SERVER.y - 7) + '" text-anchor="middle" font-family="Ubuntu, sans-serif" font-weight="700" font-size="9" fill="#212529">' + t.mapServer + '</text>';
    map.innerHTML = h;
  }
  /** Pakety letí na server, po zablokování se od štítu odrážejí. Jen obrázek: pokusy počítá tick(). */
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (now > nextPacket) {
      nextPacket = now + (blocked ? 340 : 130);
      packets.push({ t: 0, from: Math.random() < 0.86 ? 0 : 1 + Math.floor(Math.random() * 2), back: false });
    }
    const wall = 1 - (RING + shields * 9) / 170;
    let h = '';
    packets = packets.filter(p => {
      p.t += (p.back ? -1.3 : 0.96) * dt;
      if (p.t < 0 || p.t >= 1) return false;
      if (blocked && p.from === 0 && !p.back && p.t > wall) p.back = true;
      const src = SOURCES[p.from]!;
      const x = src.x + (SERVER.x - src.x) * p.t, y = src.y + (SERVER.y - src.y) * p.t;
      h += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.2" fill="' + (p.from === 0 ? (p.back ? '#FABA20' : '#FF6B93') : '#ADB5BD') + '"/>';
      return true;
    });
    const box = map.querySelector('#s-packets');
    if (box) box.innerHTML = h;
  }

  /* ---------- terminál ---------- */
  function line(box: Element, cls: string, html: string) {
    const d = document.createElement('div');
    d.className = cls;
    d.innerHTML = html;
    box.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }
  function resetTerminal() {
    out.innerHTML = '<div class="blk"></div>';
    line(out.firstElementChild!, 'c', BANNER);
  }
  /** Vypíše příkaz a jeho výstup. Nový výpis je 1,5 s zvýrazněný (UX-06), čísla jdou ze stavu hry. */
  async function run(key: CmdKey) {
    const my = gen, c = commands(ctx.today, g.byIp)[key];
    $$(out, '.blk.new').forEach(b => b.classList.remove('new'));
    const blk = document.createElement('div');
    blk.className = 'blk new';
    out.appendChild(blk);
    while (out.children.length > 14) out.firstElementChild!.remove();
    line(blk, 'p', PROMPT + '<b>' + esc(c.cmd) + '</b>');
    await ctx.wait(450);
    for (const [cls, html] of c.out) {
      if (my !== gen) return;
      line(blk, cls, html);
      await ctx.wait(110);
    }
    setTimeout(() => blk.classList.remove('new'), FLASH_MS);
  }

  /* ---------- chat s Terezou (historie, poslední tři zprávy) ---------- */
  const bubble = (text: string) => '<div class="noc-msg"><span class="jana" aria-hidden="true">' + t.who + '</span><div class="bub"><small>' + t.name + '</small>' + text + '</div></div>';
  async function say(text: string) {
    const my = gen;
    if (!ctx.reduce) {
      const dots = el('<div class="noc-msg typing" aria-hidden="true"><span class="jana">' + t.who + '</span><div class="bub"><i></i><i></i><i></i></div></div>');
      chat.appendChild(dots);
      chat.scrollTop = chat.scrollHeight;
      await ctx.wait(typing(text));
      dots.remove();
      if (my !== gen) return;
    }
    $$(chat, '.noc-msg').forEach(m => m.classList.add('old'));
    chat.insertAdjacentHTML('beforeend', bubble(text));
    while (chat.children.length > 3) chat.firstElementChild!.remove();
    chat.scrollTop = chat.scrollHeight;
  }

  /* ---------- oblast kroku ---------- */
  const label = (n: Step) => '<p class="noc-steplabel">' + fill(t.stepOf, { n, title: t.steps[n - 1]! }) + '</p>';
  /** Volby se vykreslí vypnuté, zapne je až fáze „volby“. */
  const mark = '<span class="noc-mark" aria-hidden="true">' + CROSS + CHECK + '</span>';
  function cmdHtml(key: Labeled): string {
    const c = t.cmd[key];
    return '<div class="noc-cmd"><button class="noc-act" type="button" data-cmd="' + key + '" data-choice disabled>' + CHECK + '<span>' + c.label + '</span><code>' + esc(commands(ctx.today, g.byIp)[key].cmd) + '</code></button>' +
      '<button class="noc-info" type="button" aria-expanded="false" aria-controls="s-tip" aria-label="' + esc(c.info) + '">' + INFO + '</button></div>' +
      '<p class="noc-tip" id="s-tip" hidden>' + c.info + '</p><p class="noc-sum" id="s-sum" hidden></p>';
  }
  function ipHtml(): string {
    const max = attempts(g);
    return '<div class="noc-opts">' + t.q1Options.map((o, i) => {
      const n = g.byIp[o.ip]!;
      return '<button class="noc-opt" type="button" data-q1="' + i + '" data-choice disabled>' + mark + '<span class="noc-ip"><span>' + o.ip + '</span><span class="num"' + (o.ip === ATTACKER ? ' id="s-ip0"' : '') + '>' + nf(n) + '</span>' +
        '<span class="noc-bar" aria-hidden="true"><i style="width:' + Math.max(2, Math.round((n / max) * 100)) + '%"></i></span></span></button>';
    }).join('') + '</div>';
  }
  const accountHtml = () => '<div class="noc-opts">' + t.q2Options.map((o, i) =>
    '<button class="noc-opt" type="button" data-q2="' + i + '" data-choice disabled>' + mark + '<span>' + o.t + '</span></button>').join('') + '</div>';
  const shieldsHtml = () => '<div class="noc-opts noc-shields">' + t.q3Options.map(o =>
    '<button class="noc-opt noc-shield" type="button" data-shield="' + o.id + '" aria-pressed="false" data-choice disabled><span class="noc-box" aria-hidden="true">' + CHECK + CROSS + '</span><span><span>' + o.t + '</span>' + (o.d ? '<small>' + o.d + '</small>' : '') + '</span></button>').join('') +
    '</div><div class="noc-deploy"><button class="btn btn-primary" type="button" id="s-deploy" disabled>' + t.deploy + '</button><span class="noc-count" id="s-count" aria-live="polite">' + fill(t.picked, { n: 0 }) + '</span></div>' +
    '<p class="noc-hint" id="s-hint" hidden>' + t.pickTwo + '</p>';
  /** Shrnutí předchozího příkazu v kroku zůstane nad dalším pokynem, ať se neztratí. */
  const stepHtml = (b: Beat) => label(b.step) +
    (carried ? '<p class="noc-carry">' + CHECK + '<span>' + carried + '</span></p>' : '') +
    (b.ask ? '<p class="noc-q">' + b.ask + '</p>' : '') +
    (b.cmd ? cmdHtml(b.cmd) : b.pick === 'ip' ? ipHtml() : b.pick === 'account' ? accountHtml() : shieldsHtml());

  function setPhase(p: Phase) {
    phase = p;
    stepEl.dataset.phase = p;
  }
  function lockChoices() {
    $$<HTMLButtonElement>(stepEl, '[data-choice], #s-deploy').forEach(b => { b.disabled = true; });
  }
  function enableChoices() {
    $$<HTMLButtonElement>(stepEl, '[data-choice]').forEach(b => { b.disabled = b.classList.contains('no') || b.classList.contains('ok'); });
    const d = stepEl.querySelector<HTMLButtonElement>('#s-deploy');
    if (d) d.disabled = picked.size !== 2;
  }
  const focusFirst = () => stepEl.querySelector<HTMLElement>('[data-choice]:not(:disabled)')?.focus({ preventScroll: true });

  /** Takt: zpráva, pauza, otázka, volby. Terezina zpráva doběhne celá dřív, než jde cokoli zmáčknout. */
  async function beat(i: number) {
    const my = gen, b = BEATS[i]!;
    beatAt = i;
    stage.dataset.step = String(b.step);
    setPhase('message');
    lockChoices();
    if (b.say) {
      await say(b.say);
      if (my !== gen) return;
      await ctx.wait(PAUSE_MS);
      if (my !== gen) return;
    }
    const hadFocus = inStage();
    stepEl.innerHTML = stepHtml(b);
    if (hadFocus) stepEl.focus({ preventScroll: true });
    setPhase('question');
    await ctx.wait(ASK_MS);
    if (my !== gen) return;
    setPhase('choices');
    enableChoices();
    if (!root.hidden) ctx.keepVisible(stepEl);
  }
  const stepDone = (step: Step) => {
    if (timer) tick();
    sendPlay('step_complete', { step, time: seconds(g), wrong_count: g.wrong[step - 1]! });
  };
  /** Do stavu návštěvníka jde jen první hra. Napoprvé = v tomhle kroku ještě žádná chyba. */
  function answer(step: Step, ok: boolean) {
    if (firstRun) kyberAnswer(s, ok, g.wrong[step - 1] === 0, ctx.now());
  }

  async function onCmd(key: Labeled, btn: HTMLButtonElement) {
    if (phase !== 'choices') return;
    const my = gen;
    holdFocus();
    setPhase('feedback');
    btn.classList.add('ok');
    lockChoices();
    // terminál vypíše přesně číslo, na kterém se počítadlo zastaví (UX-03)
    if (key === 'count') {
      g.frozen = true;
      paintHud();
    }
    await run(key);
    if (my !== gen) return;
    if (key === 'grep') g.pct = PCT.grep;
    else if (key === 'count') g.pct = PCT.count;
    else if (key === 'ufw') {
      blocked = true;
      g.pct = PCT.blocked;
      stage.dataset.scene = 'fight';
      drawMap();
    }
    paintHud();
    const sum = fill(t.cmd[key].sum, { n: nf(attempts(g)) }), box = $(stepEl, '#s-sum');
    box.innerHTML = '<span>' + sum + '</span>';
    box.hidden = false;
    announce(sum);
    carried = sum;
    if (!root.hidden) ctx.keepVisible(box);
    await ctx.wait(READ_MS);
    if (my !== gen) return;
    void beat(beatAt + 1);
  }

  async function onPick(kind: 'ip' | 'account', i: number, btn: HTMLButtonElement) {
    if (phase !== 'choices') return;
    const step: Step = kind === 'ip' ? 1 : 2;
    const o = kind === 'ip' ? t.q1Options[i]! : t.q2Options[i]!;
    answer(step, o.ok);
    if (!o.ok) return wrong(step, [btn], o.why, ['ip' in o ? o.ip : o.id]);
    const my = gen;
    holdFocus();
    setPhase('feedback');
    btn.classList.add('ok');
    lockChoices();
    carried = '';
    if (kind === 'ip') {
      located = true;
      g.pct = PCT.found;
      drawMap();
    } else {
      await run('lock');
      if (my !== gen) return;
      g.pct = PCT.locked;
    }
    paintHud();
    stepDone(step);
    void beat(beatAt + 1);
  }

  /** Špatná volba: červeně s ✕, pod ní vysvětlení a „Zkusit znovu“. První chyba vezme hvězdu (UX-10). */
  function wrong(step: Step, btns: HTMLButtonElement[], why: string, options: string[]) {
    const first = mistakes(g) === 0;
    g.wrong[step - 1]!++;
    holdFocus();
    setPhase('feedback');
    lockChoices();
    btns.forEach(b => b.classList.add('no'));
    paintHud();
    options.forEach(option => sendPlay('wrong_answer', { step, option }));
    const fb = el('<div class="noc-fb" id="s-fb"><p>' + why + '</p>' + (first ? '<p class="noc-fb-star">' + STAR_ICON + '<span>' + t.starLost + '</span></p>' : '') +
      '<button class="btn btn-primary" type="button" id="s-retry">' + t.retry + '</button></div>');
    (step === 3 ? $(stepEl, '.noc-shields') : btns[0]!).after(fb);
    announce(why + (first ? ' ' + t.starLost : ''));
    if (inStage()) $(fb, '#s-retry').focus({ preventScroll: true });
    if (!root.hidden) ctx.keepVisible(fb);
  }
  function retry() {
    if (phase !== 'feedback') return;
    const hadFocus = inStage();
    stepEl.querySelector('#s-fb')?.remove();
    // špatné štíty se odeberou a zůstanou označené, správné zůstanou vybrané
    for (const b of $$<HTMLButtonElement>(stepEl, '.noc-shield.no')) {
      picked.delete(b.dataset.shield!);
      b.classList.remove('on');
      b.setAttribute('aria-pressed', 'false');
    }
    if (stepEl.querySelector('#s-count')) {
      $(stepEl, '#s-hint').hidden = true;
      countShields();
    }
    setPhase('choices');
    enableChoices();
    if (hadFocus) focusFirst();
  }

  function countShields() {
    $(stepEl, '#s-count').textContent = fill(t.picked, { n: picked.size });
    $<HTMLButtonElement>(stepEl, '#s-deploy').disabled = picked.size !== 2;
  }
  /** Třetí štít nejde vybrat, ukáže se hláška (UX-09). */
  function toggleShield(btn: HTMLButtonElement) {
    if (phase !== 'choices') return;
    const id = btn.dataset.shield!, hint = $(stepEl, '#s-hint');
    if (!picked.has(id) && picked.size >= 2) {
      hint.hidden = false;
      announce(t.pickTwo);
      return;
    }
    if (picked.has(id)) picked.delete(id);
    else picked.add(id);
    btn.classList.toggle('on', picked.has(id));
    btn.setAttribute('aria-pressed', String(picked.has(id)));
    if (picked.size < 2) hint.hidden = true;
    countShields();
  }
  async function deploy() {
    if (phase !== 'choices' || picked.size !== 2) return;
    const bad = t.q3Options.filter(o => picked.has(o.id) && !o.ok);
    answer(3, !bad.length);
    if (bad.length) {
      const btns = bad.map(o => $<HTMLButtonElement>(stepEl, '[data-shield="' + o.id + '"]'));
      return wrong(3, btns, bad.map(o => o.why).join(' '), bad.map(o => o.id));
    }
    const my = gen;
    holdFocus();
    setPhase('feedback');
    lockChoices();
    $$(stepEl, '.noc-shield.on').forEach(b => b.classList.add('ok'));
    await run('f2b');
    if (my !== gen) return;
    shields = 1;
    g.pct = PCT.f2b;
    drawMap();
    paintHud();
    await ctx.wait(280);
    await run('keys');
    await ctx.wait(280);
    await run('restart');
    if (my !== gen) return;
    shields = 2;
    g.pct = PCT.safe;
    pause();
    g.finished = true;
    paintHud();
    stage.dataset.scene = 'safe';
    drawMap();
    stepDone(3);
    sendPlay('game_finish', { stars: stars(g), time: seconds(g) });
    if (firstRun) {
      finish(s, 'kyber', ctx.now());
      ctx.completed('kyber', false);
    }
    await ctx.wait(RESULT_MS);
    if (my !== gen) return;
    showResult();
  }

  /* ---------- výsledková karta (UX-04, UX-11) ---------- */
  function showResult() {
    const n = stars(g), hadFocus = inStage();
    grid.hidden = true;
    stage.dataset.step = 'result';
    result.innerHTML = bubble(r.thanks) +
      '<h3 id="s-safe" tabindex="-1">' + r.title + '</h3>' +
      '<div class="noc-rstars">' + starRow(n) + '<b>' + fill(r.stars, { n }) + '</b></div>' +
      '<p class="noc-rtime">' + fill(r.time, { time: clock(seconds(g)) }) + '</p><p class="noc-compare">' + r.compare + '</p>' +
      '<ul class="noc-skills">' + r.skills.map(x => '<li>' + CHECK + x + '</li>').join('') + '</ul>' +
      '<p class="noc-course">' + r.course + '</p>' +
      '<div class="noc-ractions"><button class="btn btn-primary" type="button" id="s-next">' + r.next + '</button>' +
      '<button class="btn noc-ghost" type="button" id="s-replay">' + r.replay + '</button>' +
      '<button class="btn noc-ghost" type="button" id="s-share">' + r.share + '</button></div>' +
      '<p class="noc-copied" id="s-copied" role="status"></p>';
    result.hidden = false;
    if (!root.hidden) ctx.alignTop(stage);
    if (hadFocus) $(result, '#s-safe').focus({ preventScroll: true });
  }
  /** Kopie přes schránku, v iframe bez povolení schránky starší cestou přes výběr textu. */
  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea'), back = ctx.root.activeElement as HTMLElement | null;
      area.value = text;
      area.readOnly = true;
      area.className = 'sr';
      result.appendChild(area);
      area.focus({ preventScroll: true });
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      area.remove();
      back?.focus({ preventScroll: true });
      return ok;
    }
  }
  /** Na telefonu systémové sdílení, na počítači odkaz do schránky. Když sdílení iframe nedovolí, odkaz se zkopíruje. */
  async function share() {
    const text = fill(r.shareText, { n: stars(g), time: clock(seconds(g)) });
    const url = location.origin + location.pathname + '?ukazka=kyber';
    if (typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ text, url });
        return;
      } catch (e) {
        // návštěvník sdílení zavřel
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    if (await copy(text + ' ' + url)) $(result, '#s-copied').textContent = r.copied;
  }

  /* ---------- úvod, start a nová hra ---------- */
  function start(focus: boolean) {
    if (g.started) return;
    g.started = true;
    intro.hidden = true;
    play.inert = false;
    stage.dataset.scene = 'alarm';
    if (firstRun) touch(s, 'kyber', ctx.now());
    sendPlay('game_start');
    resume();
    drawMap();
    paintHud();
    // celý herní box pod lepicí hlavičku, ať je krok vidět bez posouvání (UX-09)
    if (!root.hidden) ctx.alignTop(stage);
    if (focus) stepEl.focus({ preventScroll: true });
    void beat(0);
  }
  function reset() {
    gen++;
    pause();
    g = newGame();
    blocked = located = false;
    shields = 0;
    carried = '';
    shownStars = -1;
    tryAcc = 0;
    packets = [];
    picked.clear();
    chat.innerHTML = '';
    resetTerminal();
    stepEl.innerHTML = label(1);
    setPhase('message');
    result.hidden = true;
    result.innerHTML = '';
    grid.hidden = false;
    stage.dataset.scene = 'intro';
    stage.dataset.step = 'intro';
    paintHud();
    drawMap();
  }
  function replay() {
    const focus = inStage();
    send('replay_click');
    firstRun = false;
    reset();
    start(focus);
  }

  reset();
  stage.addEventListener('click', e => {
    const tg = e.target as Element;
    const hit = (sel: string) => tg.closest<HTMLButtonElement>(sel);
    let b: HTMLButtonElement | null;
    if (hit('#s-start')) return start(inStage());
    if ((b = hit('[data-cmd]'))) return void onCmd(b.dataset.cmd as Labeled, b);
    if ((b = hit('[data-q1]'))) return void onPick('ip', Number(b.dataset.q1), b);
    if ((b = hit('[data-q2]'))) return void onPick('account', Number(b.dataset.q2), b);
    if ((b = hit('[data-shield]'))) return toggleShield(b);
    if (hit('#s-deploy')) return void deploy();
    if (hit('#s-retry')) return retry();
    if ((b = hit('.noc-info'))) {
      const tip = $(stepEl, '#s-tip');
      tip.hidden = !tip.hidden;
      b.setAttribute('aria-expanded', String(!tip.hidden));
      return;
    }
    if ((b = hit('#s-term-toggle'))) {
      const open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      $(root, '#s-termbox').classList.toggle('closed', !open);
      return;
    }
    if (hit('#s-next')) {
      send('result_cta_click');
      return ctx.go('vysledek');
    }
    if (hit('#s-replay')) return replay();
    if (hit('#s-share')) return void share();
  });

  return {
    el: root,
    heading: $(root, 'h2'),
    show() {
      if (shown) return;
      shown = true;
      send('game_view');
      document.addEventListener('visibilitychange', onVisibility);
      resume();
    },
    hide() {
      if (!shown) return;
      shown = false;
      document.removeEventListener('visibilitychange', onVisibility);
      pause();
    },
    destroy() {
      shown = false;
      document.removeEventListener('visibilitychange', onVisibility);
      pause();
    },
  };
}
