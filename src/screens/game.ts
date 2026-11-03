/* Tvorba her: nejdřív zahrát, pak upravit a dohrát vlastní level. Fyzika,
   level a časování jsou z prototypu 1:1. Plátno se inicializuje až při
   prvním otevření ukázky, smyčka stojí, když je obrazovka skrytá, a klávesy
   bere jen z widgetu, ne z celé stránky webu (A10). */
import cs from '../content/cs.json';
import { gameDeath, gameEdit, gamePlay, gameSkip, gameWin } from '../logic/state.ts';
import { fill } from '../logic/text.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, $$, el } from '../ui/dom.ts';
import { claimBar, viewHead } from '../ui/parts.ts';

const COLS = 12, ROWS = 7;
const EMPTY = 0, SOLID = 1, SPIKE = 2, COIN = 3;
const START = { x: 0.15, y: 5.15 };
const FLAG = { c: 11, r: 5 };
const SPEED = 4.0, GRAV = 30, JUMP = 12, PW = 0.7, PH = 0.85;
const COL = {
  sky1: '#DDF2FA', sky2: '#FFFFFF', grid: 'rgba(33,37,41,.08)', lock: 'rgba(23,73,111,.10)', solid: '#212529', grass: '#69CCEA',
  spike: '#E9225B', coin: '#FABA20', coinEdge: '#C98A00', flag: '#17496F', pole: '#212529', player: '#FABA20', outline: '#212529',
};
type Mode = 'idle' | 'play' | 'dead' | 'won' | 'edit';
interface Player { x: number; y: number; vy: number; ground: boolean }

export function createGame(ctx: Ctx): Screen {
  const t = cs.hry, s = ctx.state;
  const tool = (v: number, name: string, sw: string, on = false) =>
    `<button class="tool" type="button" data-tool="${v}" aria-pressed="${on}"><span class="sw" style="${sw}"></span>${name}</button>`;
  const root = el(`<section class="view t-game" id="v-hry" hidden><div class="container">
  ${viewHead('hry', cs.ui.duration, t.title)}
  <div class="panel">
    <div class="game-steps" aria-label="${t.stepsLabel}">${t.steps.map((x, i) => `<span class="gstep${i ? '' : ' on'}" data-gstep="${i + 1}"><b>${i + 1}</b>${x}</span>`).join('')}</div>
    <div class="toolbar" id="g-tools" role="group" aria-label="${t.toolsLabel}" hidden>
      ${tool(SOLID, t.tools.solid, 'background:var(--ink)', true)}${tool(SPIKE, t.tools.spike, 'background:var(--bad)')}${tool(COIN, t.tools.coin, 'background:var(--brand); border-radius:50%')}${tool(EMPTY, t.tools.eraser, 'background:var(--surface-2); border:1px solid var(--line-strong)')}
    </div>
    <div class="canvas-box"><canvas id="g-canvas" tabindex="-1" aria-label="${t.canvasLabel}"></canvas></div>
    <p class="game-status" id="g-status" aria-live="polite">${t.intro}</p>
    <div class="btn-row" style="margin-top:10px; align-items:center">
      <button class="btn btn-dark jump" id="g-jump" type="button" hidden>${t.jump}</button>
      <button class="btn btn-primary" id="g-play" type="button">${t.play}</button>
      <button class="btn btn-ghost" id="g-edit" type="button" hidden>${t.edit}</button>
      <button class="btn btn-ghost" id="g-reset" type="button" hidden>${t.reset}</button>
      <button class="linkish" id="g-skip" type="button" hidden>${t.skip}</button>
    </div>
    <p class="game-stats" id="g-stats"></p>
  </div>
  ${claimBar('hry', 'g-done', t.done)}
</div></section>`);

  let engine: ReturnType<typeof createEngine> | null = null;
  return {
    el: root,
    heading: $(root, 'h2'),
    show() {
      engine ??= createEngine();
      engine.onShow();
    },
    hide() { engine?.onHide(); },
    destroy() { engine?.destroy(); },
  };

  function createEngine() {
    const canvas = $<HTMLCanvasElement>(root, '#g-canvas');
    const g = canvas.getContext('2d')!;
    const playBtn = $<HTMLButtonElement>(root, '#g-play'), jumpBtn = $<HTMLButtonElement>(root, '#g-jump');
    const editBtn = $<HTMLButtonElement>(root, '#g-edit'), resetBtn = $<HTMLButtonElement>(root, '#g-reset'), skipBtn = $<HTMLButtonElement>(root, '#g-skip');
    const tools = $(root, '#g-tools'), toolBtns = $$<HTMLButtonElement>(root, '.tool'), steps = $$(root, '.gstep');
    const statusEl = $(root, '#g-status'), statsEl = $(root, '#g-stats');

    let grid: number[] = [], tool = SOLID, mode: Mode = 'idle', phase = 1, raf = 0, last = 0, p: Player | null = null, got = new Set<number>();
    let buffer = 0, coyote = 0, stuckT = 0, lastX = 0, holdTimer = 0, readyT = 0, diesSinceEdit = 0;
    let dpr = 1, visible = false, painting = false, paintVal = SOLID, lastCell = -1;

    const at = (c: number, r: number) => grid[r * COLS + c]!;
    const put = (c: number, r: number, v: number) => { grid[r * COLS + c] = v; };
    function starter() {
      grid = Array<number>(COLS * ROWS).fill(EMPTY);
      for (let c = 0; c < COLS; c++) if (c < 4 || c > 5) put(c, 6, SOLID);
      put(8, 5, SPIKE);
      put(9, 4, SOLID); put(10, 4, SOLID);
      put(2, 5, COIN); put(8, 3, COIN); put(10, 3, COIN);
    }
    const coinCount = () => grid.filter(v => v === COIN).length;
    const solidAt = (c: number, r: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS && at(c, r) === SOLID;
    const overlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const circleHit = (pl: Player, cx: number, cy: number, rad: number) => {
      const nx = clamp(cx, pl.x, pl.x + PW), ny = clamp(cy, pl.y, pl.y + PH);
      return (cx - nx) ** 2 + (cy - ny) ** 2 <= rad * rad;
    };
    const locked = (c: number, r: number) => (c === 0 && r >= 3 && r <= 5) || (c === FLAG.c && (r === 4 || r === 5));

    function rr(x: number, y: number, w: number, h: number, r: number) {
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, w, h, r);
      else { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    }
    function draw() {
      const grad = g.createLinearGradient(0, 0, 0, ROWS);
      grad.addColorStop(0, COL.sky1); grad.addColorStop(1, COL.sky2);
      g.fillStyle = grad; g.fillRect(0, 0, COLS, ROWS);
      if (mode === 'edit') {
        g.fillStyle = COL.lock; g.fillRect(0, 3, 1, 3); g.fillRect(FLAG.c, 4, 1, 2);
        g.strokeStyle = COL.grid; g.lineWidth = 0.03; g.beginPath();
        for (let c = 1; c < COLS; c++) { g.moveTo(c, 0); g.lineTo(c, ROWS); }
        for (let r = 1; r < ROWS; r++) { g.moveTo(0, r); g.lineTo(COLS, r); }
        g.stroke();
      }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = at(c, r);
        if (v === SOLID) {
          g.fillStyle = COL.solid; rr(c + 0.02, r + 0.02, 0.96, 0.96, 0.12); g.fill();
          if (r === 0 || at(c, r - 1) !== SOLID) { g.fillStyle = COL.grass; rr(c + 0.02, r + 0.02, 0.96, 0.22, 0.1); g.fill(); }
        } else if (v === SPIKE) {
          g.fillStyle = COL.spike; g.beginPath();
          for (let i = 0; i < 3; i++) { const x0 = c + 0.08 + i * 0.28; g.moveTo(x0, r + 1); g.lineTo(x0 + 0.14, r + 0.38); g.lineTo(x0 + 0.28, r + 1); }
          g.closePath(); g.fill();
        } else if (v === COIN && !((mode === 'play' || mode === 'dead' || mode === 'won') && got.has(r * COLS + c))) {
          g.beginPath(); g.arc(c + 0.5, r + 0.5, 0.26, 0, Math.PI * 2);
          g.fillStyle = COL.coin; g.fill(); g.lineWidth = 0.06; g.strokeStyle = COL.coinEdge; g.stroke();
        }
      }
      g.fillStyle = COL.pole; g.fillRect(FLAG.c + 0.45, FLAG.r - 0.9, 0.08, 1.9);
      g.fillStyle = COL.flag; g.beginPath(); g.moveTo(FLAG.c + 0.53, FLAG.r - 0.9); g.lineTo(FLAG.c + 0.98, FLAG.r - 0.68); g.lineTo(FLAG.c + 0.53, FLAG.r - 0.46); g.closePath(); g.fill();
      const pl = p ?? START;
      rr(pl.x, pl.y, PW, PH, 0.14); g.fillStyle = COL.player; g.fill(); g.lineWidth = 0.06; g.strokeStyle = COL.outline; g.stroke();
      g.fillStyle = COL.outline; g.beginPath();
      g.arc(pl.x + 0.42, pl.y + 0.3, 0.06, 0, Math.PI * 2); g.arc(pl.x + 0.58, pl.y + 0.3, 0.06, 0, Math.PI * 2); g.fill();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (phase === 1 && s.hry.plays <= 3 && mode !== 'edit') {
        g.fillStyle = COL.flag; g.font = '700 0.42px "Ubuntu", Arial, sans-serif';
        g.fillText(t.jumpHere, 3.4, 3.9);
        g.beginPath(); g.moveTo(3.2, 4.25); g.lineTo(3.6, 4.25); g.lineTo(3.4, 4.55); g.closePath(); g.fill();
      }
      if (mode === 'play' && readyT > 0) {
        g.fillStyle = 'rgba(255,255,255,.75)'; rr(COLS / 2 - 1.6, 1.4, 3.2, 1.6, 0.3); g.fill();
        g.fillStyle = COL.outline; g.font = '700 1px "Ubuntu", Arial, sans-serif';
        g.fillText(String(Math.ceil(readyT / 0.3)), COLS / 2, 2.25);
      }
    }
    /* Dlaždice podle šířky widgetu a výšky okna pod lepicí hlavičkou webu.
       Na samostatné stránce je odstup 0, takže to vyjde jako v prototypu. */
    function resize() {
      const w = canvas.parentElement?.clientWidth || 0;
      if (!w) return;
      const tile = Math.min(w / COLS, ((innerHeight - ctx.topOffset()) * 0.48) / ROWS);
      canvas.style.width = tile * COLS + 'px';
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(tile * COLS * dpr);
      canvas.height = Math.round(tile * ROWS * dpr);
      canvas.style.height = tile * ROWS + 'px';
      g.setTransform(dpr * tile, 0, 0, dpr * tile, 0, 0);
      draw();
    }

    function step(dt: number) {
      const pl = p!;
      if (readyT > 0) { readyT -= dt; return; }
      coyote = pl.ground ? 0.1 : Math.max(0, coyote - dt);
      buffer = Math.max(0, buffer - dt);
      if (buffer > 0 && coyote > 0) { pl.vy = -JUMP; pl.ground = false; coyote = 0; buffer = 0; }
      pl.x += SPEED * dt;
      let r0 = Math.floor(pl.y + 0.01), r1 = Math.floor(pl.y + PH - 0.01);
      const cR = Math.floor(pl.x + PW);
      for (let r = r0; r <= r1; r++) { if (solidAt(cR, r)) { pl.x = cR - PW - 0.001; break; } }
      pl.vy = Math.min(pl.vy + GRAV * dt, 22);
      pl.y += pl.vy * dt;
      pl.ground = false;
      const c0 = Math.floor(pl.x + 0.01), c1 = Math.floor(pl.x + PW - 0.01);
      if (pl.vy > 0) {
        const rB = Math.floor(pl.y + PH);
        for (let c = c0; c <= c1; c++) { if (solidAt(c, rB)) { pl.y = rB - PH; pl.vy = 0; pl.ground = true; break; } }
      } else if (pl.vy < 0) {
        const rT = Math.floor(pl.y);
        for (let c = c0; c <= c1; c++) { if (solidAt(c, rT)) { pl.y = rT + 1; pl.vy = 0; break; } }
      }
      stuckT = pl.x - lastX < 0.0005 ? stuckT + dt : 0;
      lastX = pl.x;
      if (stuckT > 1.4) return die(t.deathWall);
      r0 = Math.floor(pl.y); r1 = Math.floor(pl.y + PH);
      for (let r = r0; r <= r1; r++) for (let c = c0 - 1; c <= c1 + 1; c++) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        const v = at(c, r);
        if (v === SPIKE && overlap(pl.x, pl.y, PW, PH, c + 0.15, r + 0.42, 0.7, 0.58)) return die(t.deathSpikes);
        if (v === COIN && !got.has(r * COLS + c) && circleHit(pl, c + 0.5, r + 0.5, 0.38)) got.add(r * COLS + c);
      }
      if (overlap(pl.x, pl.y, PW, PH, FLAG.c + 0.4, FLAG.r - 0.9, 0.6, 1.9) || pl.x > COLS) return win();
      if (pl.y > ROWS + 0.5) return die(t.deathHole);
    }
    function tick(now: number) {
      if (mode !== 'play') return;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      const n = Math.max(1, Math.ceil(dt / 0.0167));
      for (let i = 0; i < n && mode === 'play'; i++) step(dt / n);
      draw();
      if (mode === 'play') raf = requestAnimationFrame(tick);
    }
    function play() {
      clearTimeout(holdTimer);
      playBtn.disabled = false;
      const hadFocus = ctx.root.activeElement === playBtn;
      mode = 'play';
      gamePlay(s, phase >= 2 && s.hry.edits > 0, ctx.now());
      p = { x: START.x, y: START.y, vy: 0, ground: false };
      got = new Set(); buffer = 0; coyote = 0; stuckT = 0; lastX = p.x; readyT = 0.9;
      status(t.playing);
      ui();
      // tlačítko Hrát se schová: fokus na Skok, aby mezerník dál skákal
      if (hadFocus) jumpBtn.focus({ preventScroll: true });
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }
    function unlockEdit(msg: string) {
      phase = 2;
      edit(true);
      status(msg);
      ctx.reveal(tools);
    }
    function die(msg: string) {
      mode = 'dead';
      cancelAnimationFrame(raf);
      gameDeath(s);
      draw();
      if (phase === 1 && s.hry.plays >= 3) {
        unlockEdit(msg + ' ' + t.unlock);
        holdPlay();
        return;
      }
      if (phase >= 2) diesSinceEdit++;
      status(msg + ' ' + (diesSinceEdit >= 3 ? t.tooHard : t.retry));
      if (s.hry.plays >= 6 && s.hry.status !== 'done') skipBtn.hidden = false;
      ui();
      holdPlay();
    }
    /* po pádu se hra sama nespouští: Hrát znovu je chvilku neaktivní, aby ho nespustilo klepnutí, které mělo být skokem */
    function holdPlay() {
      playBtn.disabled = true;
      clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => {
        playBtn.disabled = false;
        const inside = ctx.root.activeElement;
        const lost = document.activeElement === document.body || document.activeElement === ctx.host;
        if (mode === 'dead' && visible && lost && (!inside || inside === canvas)) playBtn.focus({ preventScroll: true });
      }, 900);
    }
    function win() {
      mode = 'won';
      cancelAnimationFrame(raf);
      const own = phase >= 2 && s.hry.edits > 0;
      const first = gameWin(s, own, got.size, ctx.now());
      draw();
      const coins = fill(t.coins, { got: got.size, total: coinCount() });
      if (phase === 1) {
        unlockEdit(fill(t.winFirst, { coins }));
        return;
      }
      if (own) {
        status(fill(t.winOwn, { coins }));
        phase = 3;
        ui();
        ctx.completed('hry', first);
      } else {
        status(fill(t.winDefault, { coins }));
        ui();
      }
    }
    function edit(quiet: boolean) {
      cancelAnimationFrame(raf);
      mode = 'edit'; p = null; got = new Set();
      draw(); ui();
      if (!quiet) status(t.editHelp);
    }
    function status(text: string) { statusEl.textContent = text; }
    function ui() {
      const playing = mode === 'play';
      playBtn.textContent = mode === 'play' || mode === 'dead' || mode === 'won' ? t.playAgain : t.play;
      tools.hidden = phase < 2;
      editBtn.hidden = phase < 2 || mode === 'edit';
      resetBtn.hidden = phase < 2 || mode !== 'edit';
      jumpBtn.hidden = !playing;
      playBtn.hidden = playing;
      // dokud člověk poprvé nehrál, Hrát jemně pulzuje, aby bylo jasné, kam klepnout
      playBtn.classList.toggle('pulse', mode === 'idle' && s.hry.plays === 0);
      toolBtns.forEach(b => { b.disabled = mode !== 'edit'; });
      const done = s.hry.status === 'done', edited = s.hry.edits > 0;
      steps[0]!.className = 'gstep ' + (phase >= 2 ? 'ok' : 'on');
      steps[1]!.className = 'gstep ' + (edited ? 'ok' : phase >= 2 ? 'on' : '');
      steps[2]!.className = 'gstep ' + (done ? 'ok' : edited ? 'on' : '');
      statsEl.textContent = phase < 2 ? '' : fill(t.stats, { plays: s.hry.plays, edits: s.hry.edits });
      canvas.style.cursor = mode === 'edit' ? 'crosshair' : 'pointer';
    }
    function cellFrom(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const c = Math.floor((e.clientX - rect.left) / rect.width * COLS);
      const r = Math.floor((e.clientY - rect.top) / rect.height * ROWS);
      return c < 0 || c >= COLS || r < 0 || r >= ROWS ? null : { c, r };
    }
    function paint(cell: { c: number; r: number } | null, first: boolean) {
      if (!cell) return;
      const key = cell.r * COLS + cell.c;
      if (!first && key === lastCell) return;
      lastCell = key;
      if (locked(cell.c, cell.r)) { status(t.locked); return; }
      if (first) paintVal = at(cell.c, cell.r) === tool ? EMPTY : tool;
      if (at(cell.c, cell.r) === paintVal) return;
      put(cell.c, cell.r, paintVal);
      gameEdit(s, ctx.now());
      diesSinceEdit = 0;
      draw(); ui();
    }
    function jump() { if (mode === 'play') buffer = 0.14; }

    function onKey(e: Event) {
      const k = e as KeyboardEvent;
      if (!visible || mode !== 'play') return;
      if (k.code === 'Space' || k.code === 'ArrowUp') { k.preventDefault(); jump(); }
    }

    starter();
    canvas.addEventListener('pointerdown', e => {
      if (mode === 'play') { e.preventDefault(); jump(); return; }
      if (mode === 'idle') { play(); return; }
      if (mode !== 'edit') return;
      e.preventDefault();
      painting = true; lastCell = -1;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* starší prohlížeče */ }
      paint(cellFrom(e), true);
    });
    canvas.addEventListener('pointermove', e => { if (painting && mode === 'edit') paint(cellFrom(e), false); });
    const stop = () => { painting = false; };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); jump(); });
    jumpBtn.addEventListener('click', jump);
    ctx.root.addEventListener('keydown', onKey);
    toolBtns.forEach(b => b.addEventListener('click', () => {
      tool = Number(b.dataset.tool);
      toolBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    }));
    playBtn.addEventListener('click', play);
    editBtn.addEventListener('click', () => edit(false));
    resetBtn.addEventListener('click', () => { starter(); draw(); ui(); status(t.resetDone); });
    skipBtn.addEventListener('click', () => { gameSkip(s, ctx.now()); ctx.go('vysledek'); });
    const offResize = ctx.onResize(() => { if (visible) resize(); });
    // písmo nápovědy „Tady skoč!“ může dorazit až po prvním snímku
    document.fonts?.load('700 16px Ubuntu').then(() => { if (visible) draw(); }, () => {});
    ui();

    return {
      onShow() {
        visible = true;
        requestAnimationFrame(resize);
      },
      onHide() {
        if (visible && (mode === 'play' || mode === 'dead')) {
          if (phase === 1) {
            clearTimeout(holdTimer);
            playBtn.disabled = false;
            cancelAnimationFrame(raf);
            mode = 'idle'; p = null;
            draw(); ui();
          } else edit(true);
        }
        visible = false;
      },
      destroy() {
        cancelAnimationFrame(raf);
        clearTimeout(holdTimer);
        offResize();
        ctx.root.removeEventListener('keydown', onKey);
      },
    };
  }
}
