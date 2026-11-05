/* Kyberbezpečnost: noční poplach na serveru pekárny. Tři kroky, všechno
   tlačítky. Panel se po každém kroku překreslí, fokus zůstane v panelu (A11). */
import cs from '../content/cs.json';
import { BANNER, PROMPT, commands } from '../content/fixtures.ts';
import type { CmdKey } from '../content/fixtures.ts';
import { finish, kyberAnswer, touch } from '../logic/state.ts';
import { fill } from '../logic/text.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, $$, el, esc } from '../ui/dom.ts';
import { doneBar, moreSection, viewHead } from '../ui/parts.ts';

type Phase = 'start' | 'count' | 'q1' | 'block' | 'last' | 'q2' | 'q3' | 'done';
type Labeled = 'grep' | 'count' | 'ufw' | 'last';

export function createKyber(ctx: Ctx): Screen {
  const t = cs.kyber, s = ctx.state;
  const CMD = commands(ctx.today);
  const root = el(`<section class="view t-sec" id="v-kyber" hidden><div class="container">
  ${viewHead('kyber', cs.ui.duration, t.title, t.sub, `<div class="alert sec-alert"><span class="dot" aria-hidden="true"></span><p>${t.alert}</p></div>`)}
  <div class="task">
    <div class="term sec-term" aria-live="polite">
      <div class="term-bar"><i></i><i></i><i></i><span>${t.termBar}</span></div>
      <div class="sec-out" id="s-out"></div>
    </div>
    <div class="panel panel-soft stack" id="s-panel"></div>
  </div>
  ${doneBar('s-done')}
  ${moreSection('kyber')}
</div></section>`);
  const out = $(root, '#s-out'), panel = $(root, '#s-panel');

  let phase: Phase = 'start', meter = 15, busy = false;
  const tries = { q1: 0, q2: 0, q3: 0 };

  function line(cls: string, html: string) {
    const d = document.createElement('div');
    d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }
  async function run(key: CmdKey) {
    const c = CMD[key];
    line('p', PROMPT + '<b>' + esc(c.cmd) + '</b>');
    await ctx.wait(500);
    c.out.forEach(([cls, html]) => line(cls, html));
  }
  const cmdBtn = (key: Labeled) => '<button class="cmd" type="button" data-cmd="' + key + '"><span class="run" aria-hidden="true"></span><span>' + t.cmd[key] + '</span><code>' + esc(CMD[key].cmd) + '</code></button>';
  const meterRow = () => '<div class="meter-row"><span>' + t.meter + '</span><div class="meter" aria-hidden="true"><i style="width:' + meter + '%"></i></div><span>' + fill(t.meterValue, { n: meter }) + '</span></div>';
  const stepNo = (n: number) => '<p class="step-no"><span class="n">' + n + '</span>' + t.steps[n - 1] + '<span class="of">' + fill(t.stepOf, { n }) + '</span></p>';
  const opts = (name: 'q1' | 'q2', list: { t: string }[]) => '<div class="options">' + list.map((o, i) => '<button class="opt" type="button" data-' + name + '="' + i + '">' + esc(o.t) + '</button>').join('') + '</div><div class="feedback no" id="s-fb" hidden></div>';

  function render() {
    const hadFocus = panel.contains(ctx.root.activeElement);
    let h = meterRow();
    if (phase === 'start' || phase === 'count' || phase === 'q1') {
      h += stepNo(1);
      if (phase === 'start') h += '<p>' + t.start + '</p>' + cmdBtn('grep');
      if (phase === 'count') h += '<p>' + t.count + '</p>' + cmdBtn('count');
      if (phase === 'q1') h += '<p>' + t.q1 + '</p>' + opts('q1', t.q1Options);
    } else if (phase === 'block' || phase === 'last' || phase === 'q2') {
      h += stepNo(2);
      if (phase === 'block') h += '<p>' + t.block + '</p>' + cmdBtn('ufw');
      if (phase === 'last') h += '<p>' + t.last + '</p>' + cmdBtn('last');
      if (phase === 'q2') h += '<p>' + t.q2 + '</p>' + opts('q2', t.q2Options);
    } else if (phase === 'q3') {
      h += stepNo(3) + '<p>' + t.q3 + '</p><div class="checks">' +
        t.q3Options.map(o => '<label class="chk" id="lbl-' + o.id + '"><input type="checkbox" id="s-' + o.id + '"><span>' + esc(o.t) + '</span></label>').join('') +
        '</div><div class="feedback no" id="s-fb" hidden></div><div><button class="btn btn-primary" type="button" data-act="deploy">' + t.deploy + '</button></div>';
    } else {
      h += '<p class="step-no"><span class="n ok" aria-hidden="true"></span>' + t.safe + '</p><ul class="why">' +
        t.doneList.map(x => '<li>' + fill(x, { n: s.kyber.firstOk }) + '</li>').join('') + '</ul><p class="hint">' + t.doneHint + '</p>';
    }
    panel.innerHTML = h;
    if (hadFocus) panel.querySelector<HTMLElement>('.cmd, .opt, input, [data-act]')?.focus({ preventScroll: true });
  }
  function feedback(text: string) {
    const fb = panel.querySelector<HTMLElement>('#s-fb');
    if (!fb) return;
    fb.hidden = false;
    fb.textContent = text;
  }
  async function onCmd(key: Labeled, btn: HTMLButtonElement) {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    touch(s, 'kyber', ctx.now());
    await run(key);
    busy = false;
    if (key === 'grep') phase = 'count';
    else if (key === 'count') phase = 'q1';
    else if (key === 'ufw') { meter = 50; phase = 'last'; }
    else phase = 'q2';
    render();
  }
  async function answer(q: 'q1' | 'q2', i: number, btn: HTMLButtonElement) {
    if (busy) return;
    const o = (q === 'q1' ? t.q1Options : t.q2Options)[i]!;
    tries[q]++;
    kyberAnswer(s, o.ok, tries[q] === 1, ctx.now());
    if (!o.ok) {
      btn.classList.add('no');
      btn.disabled = true;
      feedback(o.why);
      return;
    }
    if (q === 'q1') { meter = 35; phase = 'block'; render(); return; }
    busy = true;
    btn.classList.add('ok');
    $$<HTMLButtonElement>(panel, '.opt').forEach(b => { b.disabled = true; });
    await run('lock');
    busy = false;
    meter = 70; phase = 'q3'; render();
  }
  async function deploy(btn: HTMLButtonElement) {
    if (busy) return;
    const picked = t.q3Options.filter(o => $<HTMLInputElement>(panel, '#s-' + o.id).checked);
    t.q3Options.forEach(o => $(panel, '#lbl-' + o.id).classList.remove('no', 'ok'));
    if (picked.length !== 2) { feedback(t.pickTwo); return; }
    tries.q3++;
    const wrong = picked.filter(o => !o.ok);
    kyberAnswer(s, !wrong.length, tries.q3 === 1, ctx.now());
    if (wrong.length) {
      wrong.forEach(o => $(panel, '#lbl-' + o.id).classList.add('no'));
      feedback(wrong.map(o => o.why).join(' ') + ' ' + t.tryAgain);
      return;
    }
    picked.forEach(o => $(panel, '#lbl-' + o.id).classList.add('ok'));
    busy = true;
    btn.disabled = true;
    await run('f2b'); await ctx.wait(300);
    await run('keys'); await ctx.wait(300);
    await run('restart');
    busy = false;
    meter = 100;
    const first = finish(s, 'kyber', ctx.now());
    phase = 'done';
    render();
    ctx.completed('kyber', first);
  }

  line('c', BANNER);
  render();
  panel.addEventListener('click', e => {
    const tg = e.target as Element;
    const c = tg.closest<HTMLButtonElement>('[data-cmd]');
    if (c) return void onCmd(c.dataset.cmd as Labeled, c);
    const a = tg.closest<HTMLButtonElement>('[data-q1],[data-q2]');
    if (a) return void answer(a.hasAttribute('data-q1') ? 'q1' : 'q2', Number(a.dataset.q1 ?? a.dataset.q2), a);
    const d = tg.closest<HTMLButtonElement>('[data-act="deploy"]');
    if (d) return void deploy(d);
  });

  return { el: root, heading: $(root, 'h2') };
}
