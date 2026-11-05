/* Tvorba her: nejdřív zahrát, pak upravit a dohrát vlastní verzi. Běží se z Coders Labu
   do herního studia, sbírá se kód a uhýbá bugům. Fyzika, herní plocha a časování jsou
   z prototypu 1:1, přibyla jen trampolína. Plátno má celou šířku rámečku: plocha 12 × 7
   je uprostřed a po stranách pokračuje obloha a zem jako kulisa. Body, rekord a hvězdy
   žijí jen v téhle obrazovce, do stavu ani do Pipedrivu nejdou. Plátno se inicializuje
   až při prvním otevření ukázky, smyčka stojí, když je obrazovka skrytá, a klávesy bere
   jen z widgetu, ne z celé stránky webu (A10). */
import cs from '../content/cs.json';
import { gameDeath, gameEdit, gamePlay, gameSkip, gameWin } from '../logic/state.ts';
import { fill, nf } from '../logic/text.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, $$, el } from '../ui/dom.ts';
import { STAR_ICON, TOOL_ICON } from '../ui/icons.ts';
import { doneBar, moreSection, viewHead } from '../ui/parts.ts';

const COLS = 12, ROWS = 7;
const EMPTY = 0, SOLID = 1, BUG = 2, CODE = 3, SPRING = 4;
const START = { x: 0.15, y: 5.15 };
const DOOR = { c: 11, r: 5 };
const SPEED = 4.0, GRAV = 30, JUMP = 12, SPRING_JUMP = JUMP * 1.36, PW = 0.7, PH = 0.85;
const LIVES = 3, HARD_BUGS = 3;
const POINTS = { code: 100, finish: 300, bug: 50, life: 50 };
const COL = {
  sky1: '#DDF2FA', sky2: '#FFFFFF', city: '#CDE9F4', cityWin: '#E9F6FB', grid: 'rgba(33,37,41,.08)', lock: 'rgba(23,73,111,.10)', veil: 'rgba(255,255,255,.6)', solid: '#212529', grass: '#69CCEA',
  bug: '#D81B53', coin: '#FABA20', coinEdge: '#C98A00', navy: '#17496F', player: '#FABA20', outline: '#212529', faint: 'rgba(33,37,41,.15)',
};
/** Výšky domů v panoramatu za hrou, opakují se dokola. */
const CITY = [2.4, 3.3, 2.1, 3.7, 2.7, 3.1, 2.2, 3.6, 2.5, 3];
const CITY_STEP = 1.6;

type Mode = 'idle' | 'play' | 'dead' | 'won' | 'edit';
type Quest = keyof typeof cs.hry.quests;
interface Player { x: number; y: number; vy: number; ground: boolean }
interface Spark { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number; max: number }
interface Floater { x: number; y: number; text: string; life: number }

export function createGame(ctx: Ctx): Screen {
  const t = cs.hry, s = ctx.state;
  const toolBtn = (v: number, key: keyof typeof t.tools, on = false) =>
    `<button class="tool" type="button" data-tool="${v}" aria-pressed="${on}"><span class="tool-ico">${TOOL_ICON[key]}</span><span class="tool-text"><b>${t.tools[key].name}</b><small>${t.tools[key].desc}</small></span></button>`;
  const root = el(`<section class="view t-game" id="v-hry" hidden><div class="container">
  ${viewHead('hry', cs.ui.duration, t.title, t.sub)}
  <div class="panel">
    <div class="game-steps" aria-label="${t.stepsLabel}">${t.steps.map((x, i) => `<span class="gstep${i ? '' : ' on'}" data-gstep="${i + 1}"><b>${i + 1}</b>${x}</span>`).join('')}</div>
    <div class="canvas-box">
      <canvas id="g-canvas" tabindex="-1" aria-label="${t.canvasLabel}"></canvas>
      <div class="score-card" id="g-card" hidden><h3 id="g-card-title"></h3><div class="stars" id="g-stars"></div><p id="g-card-points"></p><small id="g-card-best"></small></div>
    </div>
    <p class="game-status" id="g-status" aria-live="polite">${t.intro}</p>
    <ul class="star-list" id="g-reasons" hidden></ul>
    <div class="game-quests" id="g-quests" hidden><p id="g-quests-title"></p><ul id="g-quests-list"></ul></div>
    <div class="toolbar" id="g-tools" role="group" aria-label="${t.toolsLabel}" hidden>
      ${toolBtn(SOLID, 'solid', true)}${toolBtn(BUG, 'bug')}${toolBtn(CODE, 'code')}${toolBtn(SPRING, 'spring')}${toolBtn(EMPTY, 'eraser')}
    </div>
    <div class="btn-row" id="g-buttons" style="margin-top:10px; align-items:center">
      <button class="btn btn-dark jump" id="g-jump" type="button" hidden>${t.jump}</button>
      <button class="btn btn-primary" id="g-play" type="button">${t.play}</button>
      <button class="btn btn-ghost" id="g-edit" type="button" hidden>${t.edit}</button>
      <button class="btn btn-ghost" id="g-reset" type="button" hidden>${t.reset}</button>
      <button class="linkish" id="g-skip" type="button" hidden>${t.skip}</button>
    </div>
  </div>
  ${doneBar('g-done', t.done)}
  ${moreSection('hry')}
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
    const statusEl = $(root, '#g-status'), card = $(root, '#g-card'), reasons = $(root, '#g-reasons'), quests = $(root, '#g-quests'), buttons = $(root, '#g-buttons');

    let grid: number[] = [], tool = SOLID, mode: Mode = 'idle', phase = 1, raf = 0, last = 0, p: Player | null = null, got = new Set<number>();
    let buffer = 0, coyote = 0, stuckT = 0, lastX = 0, holdTimer = 0, readyT = 0, diesSinceEdit = 0, wasGround = false, gone = false;
    let dpr = 1, visible = false, painting = false, paintVal = SOLID, lastCell = -1;
    /** Kolik dlaždic plátna je vlevo a vpravo od herní plochy. */
    let side = 0;
    /** Pády od poslední výhry: v první fázi jsou to ztracené životy. */
    let lost = 0;
    let score = 0, best = 0, clock = 0, shake = 0, scorePop = 0;
    let sparks: Spark[] = [], floaters: Floater[] = [];
    const questDone = new Set<Quest>();

    const at = (c: number, r: number) => grid[r * COLS + c]!;
    const put = (c: number, r: number, v: number) => { grid[r * COLS + c] = v; };
    function starter() {
      grid = Array<number>(COLS * ROWS).fill(EMPTY);
      for (let c = 0; c < COLS; c++) if (c < 4 || c > 5) put(c, 6, SOLID);
      put(8, 5, BUG);
      put(9, 4, SOLID); put(10, 4, SOLID);
      put(2, 5, CODE); put(8, 3, CODE); put(10, 3, CODE);
    }
    const count = (v: number) => grid.filter(x => x === v).length;
    const solidAt = (c: number, r: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS && at(c, r) === SOLID;
    const overlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const circleHit = (pl: Player, cx: number, cy: number, rad: number) => {
      const nx = clamp(cx, pl.x, pl.x + PW), ny = clamp(cy, pl.y, pl.y + PH);
      return (cx - nx) ** 2 + (cy - ny) ** 2 <= rad * rad;
    };
    const locked = (c: number, r: number) => (c === 0 && r >= 3 && r <= 5) || (c === DOOR.c && (r === 4 || r === 5));

    function rr(x: number, y: number, w: number, h: number, r: number) {
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, w, h, r);
      else { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    }
    function block(c: number, r: number, top: boolean) {
      g.fillStyle = COL.solid; rr(c + 0.02, r + 0.02, 0.96, 0.96, 0.12); g.fill();
      if (top) { g.fillStyle = COL.grass; rr(c + 0.02, r + 0.02, 0.96, 0.22, 0.1); g.fill(); }
    }
    function sign(x: number, w: number, text: string) {
      const y = 0.95;
      g.fillStyle = COL.outline;
      g.fillRect(x + 0.25, y - 0.22, 0.05, 0.22); g.fillRect(x + w - 0.3, y - 0.22, 0.05, 0.22);
      rr(x, y, w, 0.58, 0.1); g.fill();
      g.fillStyle = COL.coin; g.font = '700 0.3px "Ubuntu", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, x + w / 2, y + 0.3);
    }
    function backdrop() {
      const grad = g.createLinearGradient(0, 0, 0, ROWS);
      grad.addColorStop(0, COL.sky1); grad.addColorStop(1, COL.sky2);
      g.fillStyle = grad; g.fillRect(-side, 0, COLS + 2 * side, ROWS);
      const from = Math.floor(-side / CITY_STEP) - 1, to = Math.ceil((COLS + side) / CITY_STEP) + 1;
      for (let i = from; i < to; i++) {
        const h = CITY[((i % CITY.length) + CITY.length) % CITY.length]!, x = i * CITY_STEP;
        g.fillStyle = COL.city; g.fillRect(x, ROWS - 1 - h, 1.45, h);
        g.fillStyle = COL.cityWin;
        for (let wy = ROWS - 1 - h + 0.25; wy < ROWS - 1.3; wy += 0.55) for (let wx = 0; wx < 3; wx++) g.fillRect(x + 0.2 + wx * 0.4, wy, 0.22, 0.28);
      }
      // zem po stranách je jen kulisa, postava na ni nedoběhne a nejde upravit
      for (let i = 1; i <= Math.ceil(side); i++) { block(-i, ROWS - 1, true); block(COLS - 1 + i, ROWS - 1, true); }
      sign(0.1, 2.5, t.signStart);
      sign(COLS - 2.75, 2.65, t.signEnd);
    }
    function drawBug(c: number, r: number) {
      const cx = c + 0.5, cy = r + 0.72, bob = ctx.reduce ? 0 : Math.sin(clock * 4 + c) * 0.012;
      g.strokeStyle = COL.outline; g.lineWidth = 0.045; g.beginPath();
      for (const dx of [-0.2, 0, 0.2]) {
        const kick = ctx.reduce ? 0 : Math.sin(clock * 9 + dx * 9) * 0.04;
        g.moveTo(cx + dx, cy + 0.1); g.lineTo(cx + dx * 1.5 + kick, cy + 0.3);
      }
      g.moveTo(cx - 0.12, cy - 0.22); g.lineTo(cx - 0.22, cy - 0.4);
      g.moveTo(cx + 0.12, cy - 0.22); g.lineTo(cx + 0.22, cy - 0.4);
      g.stroke();
      g.fillStyle = COL.bug; g.beginPath(); g.ellipse(cx, cy + bob, 0.33, 0.26, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(cx, cy - 0.25 + bob); g.lineTo(cx, cy + 0.25 + bob); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - 0.13, cy - 0.08 + bob, 0.075, 0, Math.PI * 2); g.arc(cx + 0.13, cy - 0.08 + bob, 0.075, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.outline; g.beginPath(); g.arc(cx - 0.11, cy - 0.08 + bob, 0.035, 0, Math.PI * 2); g.arc(cx + 0.15, cy - 0.08 + bob, 0.035, 0, Math.PI * 2); g.fill();
    }
    function drawCode(c: number, r: number) {
      const cx = c + 0.5, cy = r + 0.5 + (ctx.reduce ? 0 : Math.sin(clock * 3.5 + c) * 0.05);
      g.fillStyle = COL.coin; g.beginPath(); g.arc(cx, cy, 0.28, 0, Math.PI * 2); g.fill();
      g.lineWidth = 0.05; g.strokeStyle = COL.coinEdge; g.stroke();
      g.fillStyle = COL.outline; g.font = '700 0.26px "Ubuntu", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('</>', cx, cy + 0.01);
    }
    function drawSpring(c: number, r: number) {
      g.strokeStyle = COL.navy; g.lineWidth = 0.07; g.beginPath();
      for (let i = 0; i < 4; i++) { const y = r + 0.92 - i * 0.12; g.moveTo(c + 0.25, y); g.lineTo(c + 0.75, y - 0.06); }
      g.stroke();
      g.fillStyle = COL.coin; rr(c + 0.12, r + 0.42, 0.76, 0.14, 0.06); g.fill();
      g.fillStyle = COL.outline; rr(c + 0.12, r + 0.9, 0.76, 0.1, 0.04); g.fill();
    }
    function drawDoor() {
      const x = DOOR.c + 0.1, y = DOOR.r - 0.95;
      g.fillStyle = COL.navy; rr(x, y, 0.82, 1.95, 0.12); g.fill();
      g.fillStyle = mode === 'won' ? COL.coin : COL.grass; rr(x + 0.12, y + 0.14, 0.58, 0.6, 0.06); g.fill();
      g.fillStyle = COL.coin; g.beginPath(); g.arc(x + 0.66, y + 1.15, 0.06, 0, Math.PI * 2); g.fill();
    }
    /** Postavička je logo Coders Labu s očima. Ve vzduchu se trochu protáhne. */
    function drawPlayer() {
      if (gone) return;
      const pl = p ?? START;
      const stretch = p && !p.ground && !ctx.reduce ? Math.min(0.09, Math.abs(p.vy) * 0.008) : 0;
      const w = PW - stretch, h = PH + stretch, x = pl.x + stretch / 2, y = pl.y - stretch;
      rr(x, y, w, h, 0.14); g.fillStyle = COL.player; g.fill(); g.lineWidth = 0.06; g.strokeStyle = COL.outline; g.stroke();
      g.fillStyle = COL.outline; g.beginPath(); g.arc(x + w * 0.62, y + 0.2, 0.055, 0, Math.PI * 2); g.arc(x + w * 0.84, y + 0.2, 0.055, 0, Math.PI * 2); g.fill();
      g.font = '700 0.36px "Ubuntu", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('CL', x + w / 2, y + h * 0.64);
    }
    function drawHud() {
      const y = 0.38;
      g.textBaseline = 'middle';
      if (phase === 1) {
        for (let i = 0; i < LIVES; i++) {
          const x = 0.3 + i * 0.55;
          g.fillStyle = i < LIVES - lost ? COL.bug : COL.faint;
          g.beginPath(); g.moveTo(x, y + 0.17);
          g.bezierCurveTo(x - 0.36, y - 0.08, x - 0.14, y - 0.3, x, y - 0.12);
          g.bezierCurveTo(x + 0.14, y - 0.3, x + 0.36, y - 0.08, x, y + 0.17);
          g.fill();
        }
      }
      const right = COLS - 0.15;
      g.textAlign = 'right'; g.fillStyle = COL.outline; g.font = `700 ${0.4 + scorePop * 0.16}px "Ubuntu", Arial, sans-serif`;
      g.fillText(fill(t.points, { n: nf(score) }), right, y);
      g.font = '700 0.34px "Ubuntu", Arial, sans-serif'; g.fillStyle = COL.navy;
      g.fillText('</> ' + got.size + '/' + count(CODE), right - 2.3, y);
      if (best && mode !== 'edit') {
        g.textAlign = 'center'; g.font = '500 0.3px "Ubuntu", Arial, sans-serif';
        g.fillText(fill(t.record, { n: nf(best) }), COLS / 2 - 0.4, y);
      }
    }
    function draw() {
      g.save();
      if (shake > 0 && !ctx.reduce) g.translate(Math.sin(clock * 70) * shake * 0.35, Math.cos(clock * 60) * shake * 0.2);
      backdrop();
      if (mode === 'edit') {
        g.fillStyle = COL.veil; g.fillRect(-side, 0, side, ROWS); g.fillRect(COLS, 0, side, ROWS);
        g.fillStyle = COL.lock; g.fillRect(0, 3, 1, 3); g.fillRect(DOOR.c, 4, 1, 2);
        g.strokeStyle = COL.grid; g.lineWidth = 0.03; g.beginPath();
        for (let c = 1; c < COLS; c++) { g.moveTo(c, 0); g.lineTo(c, ROWS); }
        for (let r = 1; r < ROWS; r++) { g.moveTo(0, r); g.lineTo(COLS, r); }
        g.stroke();
      }
      drawDoor();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = at(c, r);
        if (v === SOLID) block(c, r, r === 0 || at(c, r - 1) !== SOLID);
        else if (v === BUG) drawBug(c, r);
        else if (v === SPRING) drawSpring(c, r);
        else if (v === CODE && !(mode !== 'edit' && got.has(r * COLS + c))) drawCode(c, r);
      }
      drawPlayer();
      for (const q of sparks) {
        g.globalAlpha = Math.max(0, q.life / q.max);
        g.fillStyle = q.color; g.beginPath(); g.arc(q.x, q.y, q.size, 0, Math.PI * 2); g.fill();
      }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 0.42px "Ubuntu", Arial, sans-serif'; g.fillStyle = COL.navy;
      for (const f of floaters) { g.globalAlpha = Math.min(1, f.life * 2); g.fillText(f.text, f.x, f.y); }
      g.globalAlpha = 1;
      if (phase === 1 && s.hry.plays <= LIVES && mode !== 'edit' && mode !== 'won') {
        g.fillStyle = COL.navy; g.font = '700 0.42px "Ubuntu", Arial, sans-serif';
        g.fillText(t.jumpHere, 3.4, 3.9);
        g.beginPath(); g.moveTo(3.2, 4.25); g.lineTo(3.6, 4.25); g.lineTo(3.4, 4.55); g.closePath(); g.fill();
      }
      if (mode === 'play' && readyT > 0) {
        g.fillStyle = 'rgba(255,255,255,.8)'; rr(COLS / 2 - 1.2, 2.2, 2.4, 1.6, 0.3); g.fill();
        g.fillStyle = COL.outline; g.font = '700 1px "Ubuntu", Arial, sans-serif';
        g.fillText(String(Math.ceil(readyT / 0.3)), COLS / 2, 3.05);
      }
      drawHud();
      g.restore();
    }
    /* Dlaždice podle šířky widgetu a výšky okna pod lepicí hlavičkou webu.
       Na samostatné stránce je odstup 0, takže to vyjde jako v prototypu. */
    function resize() {
      const w = canvas.parentElement?.clientWidth || 0;
      if (!w) return;
      const tile = Math.min(w / COLS, ((innerHeight - ctx.topOffset()) * 0.48) / ROWS);
      side = (w / tile - COLS) / 2;
      canvas.style.width = w + 'px';
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(tile * ROWS * dpr);
      canvas.style.height = tile * ROWS + 'px';
      g.setTransform(dpr * tile, 0, 0, dpr * tile, dpr * tile * side, 0);
      draw();
    }

    function burst(x: number, y: number, color: string, n: number, power: number) {
      if (ctx.reduce) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = power * (0.4 + Math.random());
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.5, size: 0.05 + Math.random() * 0.07, color, life: 0.55, max: 0.55 });
      }
    }
    function step(dt: number) {
      const pl = p!;
      if (readyT > 0) { readyT -= dt; return; }
      coyote = pl.ground ? 0.1 : Math.max(0, coyote - dt);
      buffer = Math.max(0, buffer - dt);
      if (buffer > 0 && coyote > 0) {
        pl.vy = -JUMP; pl.ground = false; coyote = 0; buffer = 0;
        burst(pl.x + PW / 2, pl.y + PH, '#fff', 5, 2.2);
      }
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
        for (let c = c0; c <= c1; c++) {
          if (!solidAt(c, rB)) continue;
          pl.y = rB - PH; pl.vy = 0; pl.ground = true;
          if (!wasGround) burst(pl.x + PW / 2, pl.y + PH, '#fff', 4, 1.6);
          break;
        }
      } else if (pl.vy < 0) {
        const rT = Math.floor(pl.y);
        for (let c = c0; c <= c1; c++) { if (solidAt(c, rT)) { pl.y = rT + 1; pl.vy = 0; break; } }
      }
      wasGround = pl.ground;
      stuckT = pl.x - lastX < 0.0005 ? stuckT + dt : 0;
      lastX = pl.x;
      if (stuckT > 1.4) return die(t.deathWall);
      r0 = Math.floor(pl.y); r1 = Math.floor(pl.y + PH);
      for (let r = r0; r <= r1; r++) for (let c = c0 - 1; c <= c1 + 1; c++) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        const v = at(c, r);
        if (v === BUG && overlap(pl.x, pl.y, PW, PH, c + 0.15, r + 0.42, 0.7, 0.58)) return die(t.deathBug);
        if (v === SPRING && pl.vy >= 0 && overlap(pl.x, pl.y, PW, PH, c + 0.1, r + 0.42, 0.8, 0.58)) {
          pl.vy = -SPRING_JUMP; pl.ground = false; coyote = 0;
          burst(c + 0.5, r + 0.45, COL.coin, 8, 2.6);
        }
        if (v === CODE && !got.has(r * COLS + c) && circleHit(pl, c + 0.5, r + 0.5, 0.38)) {
          got.add(r * COLS + c);
          score += POINTS.code; scorePop = 1;
          if (!ctx.reduce) floaters.push({ x: c + 0.5, y: r + 0.1, text: '+' + POINTS.code, life: 0.9 });
          burst(c + 0.5, r + 0.5, COL.coin, 10, 3);
        }
      }
      if (overlap(pl.x, pl.y, PW, PH, DOOR.c + 0.4, DOOR.r - 0.9, 0.6, 1.9) || pl.x > COLS) return win();
      if (pl.y > ROWS + 0.5) return die(t.deathHole);
    }
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      clock += dt;
      if (mode === 'play') {
        const n = Math.max(1, Math.ceil(dt / 0.0167));
        for (let i = 0; i < n && mode === 'play'; i++) step(dt / n);
      }
      for (const q of sparks) { q.life -= dt; q.vy += 9 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
      sparks = sparks.filter(q => q.life > 0);
      for (const f of floaters) { f.life -= dt; f.y -= dt * 1.1; }
      floaters = floaters.filter(f => f.life > 0);
      shake = Math.max(0, shake - dt * 1.6);
      scorePop = Math.max(0, scorePop - dt * 4);
      draw();
    }
    function hideResult() {
      card.hidden = true;
      reasons.hidden = true;
    }
    function play() {
      clearTimeout(holdTimer);
      playBtn.disabled = false;
      const hadFocus = ctx.root.activeElement === playBtn || ctx.root.activeElement === editBtn;
      mode = 'play';
      gamePlay(s, phase >= 2 && s.hry.edits > 0, ctx.now());
      p = { x: START.x, y: START.y, vy: 0, ground: false };
      got = new Set(); buffer = 0; coyote = 0; stuckT = 0; lastX = p.x; readyT = 0.9; score = 0; wasGround = false; gone = false;
      hideResult();
      status(t.playing);
      ui();
      // tlačítko Hrát se schová: fokus na Skok, aby mezerník dál skákal
      if (hadFocus) jumpBtn.focus({ preventScroll: true });
    }
    function unlockEdit(msg: string) {
      phase = 2;
      edit(true);
      status(msg);
      ctx.keepVisible(tools);
    }
    function die(msg: string) {
      mode = 'dead';
      gameDeath(s);
      const pl = p!;
      shake = 0.5;
      burst(pl.x + PW / 2, pl.y + PH / 2, COL.bug, 16, 3.6);
      burst(pl.x + PW / 2, pl.y + PH / 2, COL.coin, 10, 3);
      gone = !ctx.reduce;
      lost++;
      if (phase === 1 && lost >= LIVES) {
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
        const lostFocus = document.activeElement === document.body || document.activeElement === ctx.host;
        if (mode === 'dead' && visible && lostFocus && (!inside || inside === canvas)) playBtn.focus({ preventScroll: true });
      }, 900);
    }
    /** Karta na plátně a pod ním důvody hvězd: cíl, všechen kód a třetí podle toho, čí je to verze. */
    function showResult(own: boolean, points: number, record: boolean) {
      const total = count(CODE);
      const stars = [
        { on: true, text: t.stars.goal },
        { on: total > 0 && got.size === total, text: t.stars.code },
        own ? { on: count(BUG) >= HARD_BUGS, text: t.stars.hard } : { on: lost === 0, text: t.stars.clean },
      ];
      $(root, '#g-card-title').textContent = own ? t.cardOwn : t.cardFirst;
      $(root, '#g-stars').innerHTML = stars.map((x, i) => STAR_ICON.replace('<svg ', `<svg class="${x.on ? 'on' : ''}" style="--i:${i}" `)).join('');
      $(root, '#g-card-points').textContent = fill(t.points, { n: nf(points) });
      $(root, '#g-card-best').textContent = record ? t.cardNew : fill(t.cardBest, { n: nf(best) });
      card.hidden = false;
      reasons.innerHTML = stars.map(x => `<li class="${x.on ? 'on' : ''}">${STAR_ICON}${x.text}</li>`).join('');
      reasons.hidden = false;
    }
    function win() {
      mode = 'won';
      const hadFocus = ctx.root.activeElement === jumpBtn;
      const own = phase >= 2 && s.hry.edits > 0;
      const first = gameWin(s, own, got.size, ctx.now());
      const pl = p!;
      burst(pl.x, pl.y, COL.coin, 26, 4.5);
      burst(pl.x, pl.y, COL.grass, 18, 4);
      const points = score + POINTS.finish + count(BUG) * POINTS.bug + (own ? 0 : Math.max(0, LIVES - lost) * POINTS.life);
      const record = points > best;
      if (record) best = points;
      score = points;
      showResult(own, points, record);
      lost = 0;
      if (own) {
        status(t.winOwn);
        phase = 3;
        quest('own');
        ui();
        ctx.completed('hry', first);
      } else {
        if (phase === 1) phase = 2;
        status(t.winFirst);
        ui();
        ctx.keepVisible(buttons);
      }
      // tlačítko Skok se schovalo: fokus na to, co se teď nabízí jako první
      if (hadFocus) (own ? playBtn : editBtn).focus({ preventScroll: true });
    }
    function edit(quiet: boolean) {
      mode = 'edit'; p = null; got = new Set(); score = 0; gone = false;
      hideResult();
      ui();
      if (!quiet) status(t.editHelp);
    }
    function status(text: string) { statusEl.textContent = text; }
    function quest(k: Quest) {
      if (questDone.has(k)) return;
      questDone.add(k);
      renderQuests();
    }
    function renderQuests() {
      const keys = Object.keys(t.quests) as Quest[];
      $(root, '#g-quests-title').textContent = fill(t.questsTitle, { n: questDone.size, total: keys.length });
      $(root, '#g-quests-list').innerHTML = keys.map(k => `<li class="${questDone.has(k) ? 'on' : ''}">${t.quests[k]}</li>`).join('');
    }
    function ui() {
      const playing = mode === 'play';
      playBtn.textContent = mode === 'play' || mode === 'dead' || mode === 'won' ? t.playAgain : t.play;
      // nástroje jen při úpravách, plátno přitom zůstává na místě
      tools.hidden = mode !== 'edit';
      quests.hidden = phase < 2;
      editBtn.hidden = phase < 2 || mode === 'edit';
      resetBtn.hidden = phase < 2 || mode !== 'edit';
      jumpBtn.hidden = !playing;
      playBtn.hidden = playing;
      // dokud člověk poprvé nehrál, Hrát jemně pulzuje, aby bylo jasné, kam klepnout
      const first = mode === 'idle' && s.hry.plays === 0;
      playBtn.classList.toggle('pulse', first);
      // po první výhře svítí Upravit hru, jinak Hrát
      const wantEdit = mode === 'won' && phase === 2;
      playBtn.classList.toggle('glow', !first && !wantEdit);
      playBtn.classList.toggle('btn-primary', !wantEdit);
      playBtn.classList.toggle('btn-ghost', wantEdit);
      editBtn.classList.toggle('glow', wantEdit);
      editBtn.classList.toggle('btn-primary', wantEdit);
      editBtn.classList.toggle('btn-ghost', !wantEdit);
      const done = s.hry.status === 'done', edited = s.hry.edits > 0;
      steps[0]!.className = 'gstep ' + (phase >= 2 ? 'ok' : 'on');
      steps[1]!.className = 'gstep ' + (edited ? 'ok' : phase >= 2 ? 'on' : '');
      steps[2]!.className = 'gstep ' + (done ? 'ok' : edited ? 'on' : '');
      canvas.style.cursor = mode === 'edit' ? 'crosshair' : 'pointer';
    }
    function cellFrom(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const tile = rect.height / ROWS;
      const c = Math.floor((e.clientX - rect.left) / tile - side);
      const r = Math.floor((e.clientY - rect.top) / tile);
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
      if (paintVal === BUG) quest('bug');
      if (paintVal === CODE) quest('code');
      if (paintVal === SPRING) quest('spring');
      if (paintVal !== EMPTY) burst(cell.c + 0.5, cell.r + 0.5, COL.coin, 5, 1.8);
      ui();
    }
    function jump() { if (mode === 'play') buffer = 0.14; }

    function onKey(e: Event) {
      const k = e as KeyboardEvent;
      if (!visible || mode !== 'play') return;
      if (k.code === 'Space' || k.code === 'ArrowUp') { k.preventDefault(); jump(); }
    }

    starter();
    renderQuests();
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
    resetBtn.addEventListener('click', () => { starter(); ui(); status(t.resetDone); });
    skipBtn.addEventListener('click', () => { gameSkip(s, ctx.now()); ctx.go('vysledek'); });
    const offResize = ctx.onResize(() => { if (visible) resize(); });
    // písmo nápisů na plátně může dorazit až po prvním snímku, smyčka ho pak použije sama
    void document.fonts?.load('700 16px Ubuntu').catch(() => {});
    ui();

    return {
      onShow() {
        visible = true;
        requestAnimationFrame(() => {
          if (!visible) return;
          resize();
          last = performance.now();
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(frame);
        });
      },
      onHide() {
        if (visible && (mode === 'play' || mode === 'dead')) {
          if (phase === 1) {
            clearTimeout(holdTimer);
            playBtn.disabled = false;
            mode = 'idle'; p = null; gone = false; score = 0;
            status(t.intro);
            ui();
          } else edit(true);
        }
        visible = false;
        cancelAnimationFrame(raf);
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
