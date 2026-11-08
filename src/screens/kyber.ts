/* IT administrátor: noční poplach na serveru pekárny Kvásek. Tři kroky, všechno
   tlačítky. Vlevo Tereza z pekárny a rozhodnutí, vpravo mapa útoku a terminál, na mobilu
   mapa nahoře a terminál dole. Běží čas zásahu a pokusy útočníka, na konci jsou hvězdy:
   ty žijí jen v téhle obrazovce, do stavu ani do Pipedrivu nejdou. Panel se po každém
   kroku překreslí, fokus zůstane v panelu (A11). */
import cs from '../content/cs.json';
import { BANNER, IP, PROMPT, commands } from '../content/fixtures.ts';
import type { CmdKey } from '../content/fixtures.ts';
import { finish, kyberAnswer, touch } from '../logic/state.ts';
import { fill, nf } from '../logic/text.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, $$, el, esc } from '../ui/dom.ts';
import { STAR_ICON } from '../ui/icons.ts';
import { doneBar, moreSection, viewHead } from '../ui/parts.ts';

type Phase = 'start' | 'count' | 'q1' | 'block' | 'last' | 'q2' | 'q3' | 'done';
type Labeled = 'grep' | 'count' | 'ufw' | 'last';
interface Packet { t: number; from: number; back: boolean }

const TRIES_START = 412, TRIES_PENALTY = 25, FAST_SECONDS = 120;
/** Zdroje paketů na mapě: útočník a dvě nevinné adresy z výpisu. */
const SOURCES = [{ x: 34, y: 34 }, { x: 34, y: 140 }, { x: 366, y: 34 }];
const SERVER = { x: 215, y: 85 };
const clock = (sec: number) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');

export function createKyber(ctx: Ctx): Screen {
  const t = cs.kyber, s = ctx.state;
  const CMD = commands(ctx.today);
  const root = el(`<section class="view t-sec" id="v-kyber" hidden><div class="container">
  ${viewHead('kyber', cs.ui.duration, t.title, t.sub)}
  <div class="noc" id="s-stage" data-scene="alarm">
    <div class="noc-hud">
      <div class="noc-tile"><span>${t.hud.meter} <b class="noc-pct" id="s-pct"></b></span><div class="noc-meter" aria-hidden="true"><i id="s-meter"></i></div></div>
      <div class="noc-tile"><span>${t.hud.time}</span><b id="s-time">0:00</b></div>
      <div class="noc-tile hot" id="s-tries-box"><span>${t.hud.tries}</span><b id="s-tries"></b></div>
    </div>
    <div class="noc-grid">
      <div class="noc-main" id="s-panel"></div>
      <svg class="noc-map" id="s-map" viewBox="0 0 400 170" role="img" aria-label="${t.mapLabel}"></svg>
      <div class="noc-term" id="s-out" aria-live="polite"></div>
    </div>
  </div>
  ${doneBar('s-done', t.done)}
  ${moreSection('kyber')}
</div></section>`);
  const stage = $(root, '#s-stage'), out = $(root, '#s-out'), panel = $(root, '#s-panel'), map = $(root, '#s-map');

  let phase: Phase = 'start', busy = false, finished = false;
  let tries = TRIES_START, seconds = 0, timer = 0;
  let blocked = false, located = false, shields = 0;
  let packets: Packet[] = [], nextPacket = 0, raf = 0, lastFrame = 0;
  const asked = { q1: 0, q2: 0, q3: 0 };
  const picked = new Set<string>();

  /* ---------- přehled nahoře ---------- */
  function setMeter(v: number) {
    const m = $(root, '#s-meter');
    m.style.width = v + '%';
    m.className = v >= 90 ? 'top' : v >= 50 ? 'mid' : '';
    $(root, '#s-pct').textContent = fill(t.hud.meterValue, { n: v });
  }
  function addTries(n: number) {
    if (blocked) return;
    tries += n;
    $(root, '#s-tries').textContent = nf(tries);
    const live = panel.querySelector('#s-ip0');
    if (live) live.textContent = nf(tries);
  }
  function stopTimer() {
    clearInterval(timer);
    timer = 0;
  }
  function startTimer() {
    if (timer || finished) return;
    timer = window.setInterval(() => {
      seconds++;
      $(root, '#s-time').textContent = clock(seconds);
    }, 1000);
  }

  /* ---------- mapa útoku ---------- */
  function drawMap() {
    const color = finished ? '#2FBF71' : blocked ? '#FABA20' : '#D81B53';
    const ring = (r: number, on: boolean, stroke: string) => !on ? '' :
      '<circle cx="' + SERVER.x + '" cy="' + SERVER.y + '" r="' + r + '" fill="none" stroke="' + stroke + '" stroke-width="3.5" stroke-dasharray="' + r * 0.55 + ' ' + r * 0.08 + '">' +
      (ctx.reduce ? '' : '<animateTransform attributeName="transform" type="rotate" from="0 ' + SERVER.x + ' ' + SERVER.y + '" to="360 ' + SERVER.x + ' ' + SERVER.y + '" dur="' + r / 3 + 's" repeatCount="indefinite"/>') + '</circle>';
    let h = '';
    SOURCES.forEach((src, i) => {
      const lit = i === 0 && located, hot = i === 0 && !blocked;
      h += '<line x1="' + src.x + '" y1="' + src.y + '" x2="' + SERVER.x + '" y2="' + SERVER.y + '" stroke="#fff" stroke-opacity=".08" stroke-dasharray="3 5"/>';
      h += '<circle cx="' + src.x + '" cy="' + src.y + '" r="' + (lit ? 11 : 7) + '" fill="' + (hot ? '#D81B53' : '#6C757D') + '">' + (hot && !ctx.reduce ? '<animate attributeName="r" values="8;12;8" dur="1s" repeatCount="indefinite"/>' : '') + '</circle>';
      if (lit) h += '<circle cx="' + src.x + '" cy="' + src.y + '" r="17" fill="none" stroke="#FABA20" stroke-width="2"/><text x="' + src.x + '" y="' + (src.y + 32) + '" text-anchor="middle" font-family="Ubuntu Mono, monospace" font-size="11.5" fill="#FABA20">' + (blocked ? t.mapBlocked : t.mapAttacker) + '</text>';
    });
    h += '<g id="s-packets"></g>';
    h += ring(44, blocked, '#FABA20') + ring(54, shields >= 1, '#69CCEA') + ring(64, shields >= 2, '#2FBF71');
    h += '<rect x="' + (SERVER.x - 26) + '" y="' + (SERVER.y - 28) + '" width="52" height="56" rx="7" fill="#14171A" stroke="' + color + '" stroke-width="3"/>';
    for (let i = 0; i < 2; i++) {
      h += '<rect x="' + (SERVER.x - 19) + '" y="' + (SERVER.y + 4 + i * 11) + '" width="38" height="7" rx="2" fill="#343A40"/><circle cx="' + (SERVER.x + 14) + '" cy="' + (SERVER.y + 7.5 + i * 11) + '" r="2" fill="' + color + '"/>';
    }
    h += '<rect x="' + (SERVER.x - 19) + '" y="' + (SERVER.y - 22) + '" width="38" height="21" rx="3" fill="#FABA20"/><text x="' + SERVER.x + '" y="' + (SERVER.y - 8) + '" text-anchor="middle" font-family="Ubuntu, sans-serif" font-weight="700" font-size="10" fill="#212529">' + t.mapServer + '</text>';
    map.innerHTML = h;
  }
  /** Pakety letí na server. Dokud útočník není zablokovaný, každý jeho doletěný je další pokus. */
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (!finished && now > nextPacket) {
      nextPacket = now + (blocked ? 340 : 130);
      packets.push({ t: 0, from: Math.random() < 0.86 ? 0 : 1 + Math.floor(Math.random() * 2), back: false });
    }
    const wall = 1 - (44 + shields * 10) / 190;
    let h = '';
    packets = packets.filter(p => {
      p.t += (p.back ? -1.3 : 0.96) * dt;
      if (p.t < 0) return false;
      if (blocked && p.from === 0 && !p.back && p.t > wall) p.back = true;
      if (p.t >= 1) {
        if (p.from === 0) addTries(1);
        return false;
      }
      const src = SOURCES[p.from]!;
      const x = src.x + (SERVER.x - src.x) * p.t, y = src.y + (SERVER.y - src.y) * p.t;
      h += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.2" fill="' + (p.from === 0 ? (p.back ? '#FABA20' : '#FF6B93') : '#ADB5BD') + '"/>';
      return true;
    });
    const box = map.querySelector('#s-packets');
    if (box) box.innerHTML = h;
  }

  /* ---------- terminál ---------- */
  function line(cls: string, html: string) {
    const d = document.createElement('div');
    d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    while (out.children.length > 30) out.firstElementChild!.remove();
  }
  async function run(key: CmdKey) {
    const c = CMD[key];
    line('p', PROMPT + '<b>' + esc(c.cmd) + '</b>');
    await ctx.wait(450);
    for (const [cls, html] of c.out) {
      line(cls, html);
      await ctx.wait(110);
    }
  }

  /* ---------- panel s rozhodnutím ---------- */
  const say = (text: string, wrong = false) => '<div class="chat"><span class="jana" aria-hidden="true">' + t.who + '</span><div class="bub' + (wrong ? ' no' : '') + '"><small>' + t.name + '</small>' + text + '</div></div>';
  const stepHead = (n: number) => '<p class="noc-step">' + fill(t.stepOf, { n, title: t.steps[n - 1]! }) + '</p>';
  const cmdBtn = (key: Labeled, red = false) => '<div class="acts"><button class="act' + (red ? ' red' : '') + '" type="button" data-cmd="' + key + '" style="--i:0"><span>' + t.cmd[key] + '</span><code>' + esc(CMD[key].cmd) + '</code></button></div>';
  const talk = (html: string) => '<div id="s-say" aria-live="polite">' + html + '</div>';

  function panelHtml(): string {
    if (phase === 'start') return talk(say(t.hello)) + stepHead(1) + '<p class="noc-q">' + t.start + '</p>' + cmdBtn('grep');
    if (phase === 'count') return talk(say(t.count)) + stepHead(1) + cmdBtn('count');
    if (phase === 'q1') {
      return talk('') + stepHead(1) + '<p class="noc-q">' + t.q1 + '</p><div class="acts">' + t.q1Options.map((o, i) =>
        '<button class="act" type="button" data-q1="' + i + '" style="--i:' + i + '"><span class="noc-ip"><span>' + o.ip + '</span><span class="num"' + (o.ok ? ' id="s-ip0"' : '') + '>' + nf(o.ok ? tries : o.n) + '</span><span class="noc-bar"><i style="width:' + (o.ok ? 96 : o.n * 2) + '%"></i></span></span></button>').join('') + '</div>';
    }
    if (phase === 'block') return talk(say(t.block)) + stepHead(2) + cmdBtn('ufw', true);
    if (phase === 'last') return talk(say(t.last)) + stepHead(2) + cmdBtn('last');
    if (phase === 'q2') {
      return talk(say(t.q2Say)) + stepHead(2) + '<p class="noc-q">' + t.q2 + '</p><div class="acts">' + t.q2Options.map((o, i) =>
        '<button class="act" type="button" data-q2="' + i + '" style="--i:' + i + '">' + o.t + '</button>').join('') + '</div>';
    }
    if (phase === 'q3') {
      return talk('') + stepHead(3) + '<p class="noc-q">' + t.q3 + '</p><div class="acts">' + t.q3Options.map((o, i) =>
        '<button class="act shield" type="button" data-shield="' + o.id + '" aria-pressed="false" style="--i:' + i + '"><span class="noc-box" aria-hidden="true">✓</span><span><span>' + o.t + '</span><small>' + o.d + '</small></span></button>').join('') +
        '</div><button class="btn btn-primary glow noc-go" type="button" id="s-deploy" disabled>' + t.deploy + '</button>';
    }
    const clean = s.kyber.firstOk === t.steps.length, fast = seconds <= FAST_SECONDS;
    const stars = [
      { on: true, text: t.stars.safe },
      { on: clean, text: clean ? t.stars.clean : fill(t.stars.firstOk, { n: s.kyber.firstOk }) },
      { on: fast, text: fill(t.stars.fast, { time: clock(seconds) }) },
    ];
    return talk(say(t.thanks)) + '<div class="noc-win"><h3 id="s-safe" tabindex="-1">' + t.safe + '</h3><div class="stars">' +
      stars.map((x, i) => STAR_ICON.replace('<svg ', '<svg class="' + (x.on ? 'on' : '') + '" style="--i:' + i + '" ')).join('') +
      '</div><ul class="star-list">' + stars.map(x => '<li class="' + (x.on ? 'on' : '') + '">' + STAR_ICON + x.text + '</li>').join('') + '</ul><p class="noc-note">' + t.doneHint + '</p></div>';
  }
  function render() {
    const hadFocus = panel.contains(ctx.root.activeElement);
    panel.innerHTML = panelHtml();
    if (hadFocus) panel.querySelector<HTMLElement>('.act')?.focus({ preventScroll: true });
    const acts = panel.querySelector('.acts');
    if (acts && !root.hidden) ctx.keepVisible(acts);
  }
  function feedback(text: string, wrong = true) {
    const box = $(panel, '#s-say');
    box.innerHTML = say(text, wrong);
    ctx.keepVisible(box);
  }
  async function onCmd(key: Labeled, btn: HTMLButtonElement) {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    btn.classList.add('ok');
    touch(s, 'kyber', ctx.now());
    await run(key);
    busy = false;
    if (key === 'grep') { setMeter(20); phase = 'count'; }
    else if (key === 'count') { setMeter(25); phase = 'q1'; }
    else if (key === 'ufw') {
      blocked = true;
      setMeter(50);
      stage.dataset.scene = 'fight';
      $(root, '#s-tries-box').classList.remove('hot');
      drawMap();
      phase = 'last';
    } else phase = 'q2';
    render();
  }
  function answerIp(i: number, btn: HTMLButtonElement) {
    if (busy) return;
    const o = t.q1Options[i]!;
    asked.q1++;
    kyberAnswer(s, o.ok, asked.q1 === 1, ctx.now());
    if (!o.ok) {
      btn.classList.add('no');
      btn.disabled = true;
      addTries(TRIES_PENALTY);
      return feedback(o.why);
    }
    located = true;
    drawMap();
    setMeter(35);
    phase = 'block';
    render();
  }
  async function answerAccount(i: number, btn: HTMLButtonElement) {
    if (busy) return;
    const o = t.q2Options[i]!;
    asked.q2++;
    kyberAnswer(s, o.ok, asked.q2 === 1, ctx.now());
    if (!o.ok) {
      btn.classList.add('no');
      btn.disabled = true;
      $$<HTMLButtonElement>(panel, '.act:not(:disabled)')[0]?.focus({ preventScroll: true });
      return feedback(o.why);
    }
    busy = true;
    btn.classList.add('ok');
    $$<HTMLButtonElement>(panel, '.act').forEach(b => { b.disabled = true; });
    await run('lock');
    busy = false;
    setMeter(70);
    phase = 'q3';
    render();
  }
  function toggleShield(btn: HTMLButtonElement) {
    if (busy) return;
    const id = btn.dataset.shield!;
    if (picked.has(id)) picked.delete(id);
    else picked.add(id);
    btn.classList.toggle('on', picked.has(id));
    btn.classList.remove('no');
    btn.setAttribute('aria-pressed', String(picked.has(id)));
    $<HTMLButtonElement>(panel, '#s-deploy').disabled = picked.size !== 2;
    if (picked.size > 2) feedback(t.pickTwo, false);
    else $(panel, '#s-say').innerHTML = '';
  }
  async function deploy(btn: HTMLButtonElement) {
    if (busy || picked.size !== 2) return;
    const focusIn = panel.contains(ctx.root.activeElement);
    asked.q3++;
    const wrong = t.q3Options.filter(o => picked.has(o.id) && !o.ok);
    kyberAnswer(s, !wrong.length, asked.q3 === 1, ctx.now());
    if (wrong.length) {
      wrong.forEach(o => $(panel, '[data-shield="' + o.id + '"]').classList.add('no'));
      return feedback(wrong.map(o => o.why).join(' ') + ' ' + t.tryAgain);
    }
    busy = true;
    btn.disabled = true;
    $$<HTMLButtonElement>(panel, '.act').forEach(b => { b.disabled = true; });
    await run('f2b');
    shields = 1;
    drawMap();
    setMeter(85);
    await ctx.wait(280);
    await run('keys');
    await ctx.wait(280);
    await run('restart');
    shields = 2;
    setMeter(100);
    busy = false;
    finished = true;
    stopTimer();
    finish(s, 'kyber', ctx.now());
    stage.dataset.scene = 'safe';
    drawMap();
    phase = 'done';
    render();
    // „Server je v bezpečí“ a tlačítko k výsledku pod ním mají být vidět naráz
    ctx.completed('kyber', false);
    if (!root.hidden) ctx.alignTop(stage);
    if (focusIn && !root.hidden) $(root, '#s-done .btn').focus({ preventScroll: true });
  }

  line('c', BANNER);
  setMeter(15);
  $(root, '#s-tries').textContent = nf(tries);
  drawMap();
  render();
  panel.addEventListener('click', e => {
    const tg = e.target as Element;
    const c = tg.closest<HTMLButtonElement>('[data-cmd]');
    if (c) return void onCmd(c.dataset.cmd as Labeled, c);
    const ip = tg.closest<HTMLButtonElement>('[data-q1]');
    if (ip) return answerIp(Number(ip.dataset.q1), ip);
    const acc = tg.closest<HTMLButtonElement>('[data-q2]');
    if (acc) return void answerAccount(Number(acc.dataset.q2), acc);
    const sh = tg.closest<HTMLButtonElement>('[data-shield]');
    if (sh) return toggleShield(sh);
    const d = tg.closest<HTMLButtonElement>('#s-deploy');
    if (d) return void deploy(d);
  });

  return {
    el: root,
    heading: $(root, 'h2'),
    show() {
      startTimer();
      if (ctx.reduce) return;
      lastFrame = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    hide() {
      stopTimer();
      cancelAnimationFrame(raf);
    },
    destroy() {
      stopTimer();
      cancelAnimationFrame(raf);
    },
  };
}
