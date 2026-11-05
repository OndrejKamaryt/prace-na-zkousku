/* Datová analýza: kavárna Zrnko jako klikačka po třech krocích (měsíce, produkty,
   dny). Na obrazovce je vždy jen jeden krok. Špatná odpověď zmizí, po dvou špatných
   v kroku se ukáže správná: cílem není ukázku vyřešit, ale vidět, co analytik dělá. */
import cs from '../content/cs.json';
import { SQL } from '../content/fixtures.ts';
import { answerData, finishData } from '../logic/state.ts';
import { fill, kc } from '../logic/text.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, $$, el } from '../ui/dom.ts';
import { claimBar, viewHead } from '../ui/parts.ts';

type Step = (typeof cs.data.steps)[number];
type Row = [label: string, a: number, b?: number];

const pct = (v: number, max: number) => (v / max * 100).toFixed(1) + '%';

/** Jedna řada: pruh a částka. Dvě řady: světlý únor a tmavý březen, každý se svou částkou. */
function chart(step: Step): string {
  const rows = step.rows as Row[];
  const pair = rows.some(r => r[2] !== undefined);
  const max = Math.max(...rows.flatMap(r => [r[1], r[2] ?? 0]));
  const t = cs.data;
  const line = (v: number, pale: boolean) =>
    '<div class="bar-line"><div class="bar-track thin"><div class="bar-fill' + (pale ? ' pale' : '') + '" style="width:' + pct(v, max) + '"></div></div><span class="num' + (pale ? ' pale' : '') + '">' + kc(v) + '</span></div>';
  const body = rows.map(([label, a, b]) => pair
    ? '<div class="bar-row pair"><span class="bar-label">' + label + '</span><div class="bar-pair">' + line(a, true) + line(b ?? 0, false) + '</div></div>'
    : '<div class="bar-row"><span class="bar-label">' + label + '</span><div class="bar-track"><div class="bar-fill" style="width:' + pct(a, max) + '"></div></div><span class="num">' + kc(a) + '</span></div>').join('');
  const legend = pair
    ? '<div class="legend"><span><i class="sw" style="background:var(--data-pale)"></i>' + t.legendFeb + '</span><span><i class="sw" style="background:var(--data)"></i>' + t.legendMar + '</span></div>'
    : '';
  return '<div class="bars">' + body + '</div>' + legend;
}

export function createData(ctx: Ctx): Screen {
  const t = cs.data, s = ctx.state;
  const root = el(`<section class="view t-data" id="v-data" hidden><div class="container">
  ${viewHead('data', cs.ui.duration, t.title)}
  <div class="mission"><span class="who" aria-hidden="true">${t.who}</span><p>${t.mission}</p></div>
  <div class="panel data-step" id="d-step"></div>
  ${claimBar('data', 'd-done', t.done)}
</div></section>`);
  const panel = $(root, '#d-step');
  let current = 0;

  function renderStep(i: number) {
    current = i;
    const step = t.steps[i]!;
    panel.innerHTML =
      '<p class="step-no" id="d-step-title" tabindex="-1"><span class="n">' + (i + 1) + '</span>' + step.title + '<span class="of">' + fill(t.stepOf, { n: i + 1 }) + '</span></p>' +
      '<p class="step-text">' + step.text + '</p>' + chart(step) +
      '<p class="q-title">' + step.question + '</p>' +
      '<div class="options short" id="d-options">' + step.options.map((o, n) => '<button type="button" class="opt" data-opt="' + n + '">' + o.t + '</button>').join('') + '</div>' +
      '<div class="feedback" id="d-fb" aria-live="polite" hidden></div>' +
      '<div class="btn-row" id="d-next-row" hidden><button type="button" class="btn btn-primary" id="d-next">' + t.next + '</button></div>';
  }

  function showNext() {
    const row = $(panel, '#d-next-row');
    row.hidden = false;
    $(row, '#d-next').focus({ preventScroll: true });
    ctx.keepVisible(row);
  }

  function answer(i: number, btn: HTMLButtonElement) {
    const step = t.steps[current]!, o = step.options[i]!;
    const outcome = answerData(s, o.ok, ctx.now());
    if (outcome === 'ignored') return;
    const fb = $(panel, '#d-fb');
    const opts = $$<HTMLButtonElement>(panel, '.opt');
    if (outcome === 'wrong') {
      btn.classList.add('no');
      btn.disabled = true;
      fb.hidden = false;
      fb.className = 'feedback no';
      fb.textContent = o.why;
      opts.find(b => !b.disabled)?.focus({ preventScroll: true });
      ctx.keepVisible(fb);
      return;
    }
    opts.forEach(b => { b.disabled = true; });
    if (outcome === 'solved') {
      btn.classList.add('ok');
      // po správné odpovědi v posledním kroku rovnou výsledek ukázky
      if (current === t.steps.length - 1) return end();
      fb.className = 'feedback ok';
      fb.textContent = o.why;
    } else {
      btn.classList.add('no');
      opts[step.options.findIndex(x => x.ok)]!.classList.add('ok');
      fb.className = 'feedback';
      fb.textContent = t.revealed;
    }
    fb.hidden = false;
    showNext();
  }

  function next() {
    if (current === t.steps.length - 1) return end();
    renderStep(current + 1);
    ctx.alignTop(panel);
    $(panel, '#d-step-title').focus({ preventScroll: true });
  }

  function end() {
    finishData(s, ctx.now());
    panel.innerHTML =
      '<p class="step-no" id="d-end" tabindex="-1"><span class="n ok" aria-hidden="true"></span>' + t.resultTitle + '</p>' +
      '<p class="step-text">' + t.resultText + '</p><p class="hint step-text">' + t.resultHint + '</p>' +
      '<details class="more" id="d-sql-box"><summary>' + t.sqlSummary + '</summary><p class="fine" style="margin-top:8px">' + t.sqlIntro + '</p><pre class="code" id="d-sql"></pre><p class="fine" style="margin-top:8px">' + t.sqlOutro + '</p></details>';
    $(panel, '#d-sql').textContent = SQL;
    ctx.completed('data', false);
    ctx.alignTop(panel);
    $(panel, '#d-end').focus({ preventScroll: true });
  }

  panel.addEventListener('click', e => {
    const tg = e.target as Element;
    const opt = tg.closest<HTMLButtonElement>('[data-opt]');
    if (opt) return answer(Number(opt.dataset.opt), opt);
    if (tg.closest('#d-next')) next();
  });
  renderStep(0);

  return { el: root, heading: $(root, 'h2') };
}
