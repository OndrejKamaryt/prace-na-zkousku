/* Datová analýza: kavárna Zrnko. Pohledy na data, čtyři odpovědi, po třech
   chybách ukáže správnou. Plovoucí tlačítko „Znám viníka“ je popover v top
   layer a řídí ho šířka widgetu, ne okna. */
import cs from '../content/cs.json';
import { SQL } from '../content/fixtures.ts';
import { answerData, viewData } from '../logic/state.ts';
import { fill, kc, nf } from '../logic/text.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, $$, el } from '../ui/dom.ts';
import { claimBar, viewHead } from '../ui/parts.ts';

type DView = keyof typeof cs.data.views;
const DVIEWS = Object.keys(cs.data.views) as DView[];
type Row = [label: string, a: number, b?: number];

const pct = (v: number, max: number) => (v / max * 100).toFixed(1) + '%';
const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

export function createData(ctx: Ctx): Screen {
  const t = cs.data, s = ctx.state;
  const root = el(`<section class="view t-data" id="v-data" hidden><div class="container">
  ${viewHead('data', cs.ui.duration, t.title)}
  <div class="mission"><span class="who" aria-hidden="true">${t.who}</span><p>${t.mission}<span class="tip">${t.tip}</span></p></div>
  <div class="task">
    <div class="panel">
      <div class="tabs" role="tablist" aria-label="${t.tabsLabel}">${DVIEWS.map(v => `<button class="tab" role="tab" type="button" data-dview="${v}" aria-selected="${v === 'mesice'}">${t.tabs[v]}</button>`).join('')}</div>
      <div id="d-chart" role="tabpanel" aria-live="polite"></div>
    </div>
    <div class="panel panel-soft">
      <p class="q-title">${t.question}</p>
      <p class="seen" id="d-seen"></p>
      <div class="options" id="d-options"></div>
      <div class="feedback" id="d-feedback" hidden></div>
      <details class="more" id="d-sql-box" hidden><summary>${t.sqlSummary}</summary><p class="fine" style="margin-top:8px">${t.sqlIntro}</p><pre class="code" id="d-sql"></pre><p class="fine" style="margin-top:8px">${t.sqlOutro}</p></details>
    </div>
  </div>
  <button class="btn btn-dark fab" id="d-fab" type="button">${t.fab}</button>
  ${claimBar('data', 'd-done', t.done)}
</div></section>`);

  const chart = $(root, '#d-chart'), seen = $(root, '#d-seen'), box = $(root, '#d-options'), fb = $(root, '#d-feedback');
  const fab = $<HTMLButtonElement>(root, '#d-fab');
  const tabs = $$<HTMLButtonElement>(root, '[data-dview]');
  if (supportsPopover) fab.popover = 'manual';
  else fab.hidden = true;

  let shown = false, optsVisible = true, io: IntersectionObserver | null = null;

  function setFab(on: boolean) {
    if (!supportsPopover) {
      fab.hidden = !on;
      return;
    }
    const open = fab.matches(':popover-open');
    if (on && !open) {
      fab.style.setProperty('--pnz-fab-bottom', 16 + ctx.bottomOffset() + 'px');
      fab.showPopover();
    } else if (!on && open) fab.hidePopover();
  }
  function updateFab() {
    setFab(shown && !optsVisible && s.data.status !== 'done' && ctx.width() < 880 && s.data.views.length >= 2);
  }

  function renderData(view: DView, initial = false) {
    viewData(s, view, ctx.now(), initial);
    tabs.forEach(b => b.setAttribute('aria-selected', String(b.dataset.dview === view)));
    const d = t.views[view], rows = d.rows as Row[];
    let h = '<p class="hint" style="margin-top:14px">' + d.note + '</p><div class="bars">';
    if (view === 'mesice') {
      const max = Math.max(...rows.map(r => r[1]));
      for (const [l, v] of rows) {
        h += '<div class="bar-row"><span class="bar-label">' + l + '</span><div class="bar-track"><div class="bar-fill" style="width:' + pct(v, max) + '"></div></div><span class="num">' + kc(v) + '</span></div>';
      }
      h += '</div><div class="kpis"><div class="kpi">' + t.kpiSpend + '<b>' + t.kpiSpendValue + '</b></div><div class="kpi">' + t.kpiReceipts + '<b>' + t.kpiReceiptsValue + '</b></div></div>';
    } else {
      const max = Math.max(...rows.flatMap(r => [r[1], r[2] ?? 0]));
      for (const [l, a, b = 0] of rows) {
        const diff = b - a;
        const neg = diff < -0.1 * a;
        const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
        h += '<div class="bar-row"><span class="bar-label">' + l + '</span><div class="bar-pair">' +
          '<div class="bar-track thin"><div class="bar-fill pale" style="width:' + pct(a, max) + '"></div></div>' +
          '<div class="bar-track thin"><div class="bar-fill" style="width:' + pct(b, max) + '"></div></div></div>' +
          '<span class="num' + (neg ? ' neg' : '') + '">' + kc(b) + '<small>' + sign + kc(Math.abs(diff)) + '</small></span></div>';
      }
      h += '</div><div class="legend"><span><i class="sw" style="background:var(--data-pale)"></i>' + t.legendFeb + '</span><span><i class="sw" style="background:var(--data)"></i>' + t.legendMar + '</span></div>';
    }
    chart.innerHTML = h;
    seen.textContent = fill(t.seen, { n: nf(s.data.views.length) });
    updateFab();
  }

  const okIdx = t.options.findIndex(o => o.ok);
  const opts = t.options.map((o, i) => {
    const b = el<HTMLButtonElement>('<button type="button" class="opt"></button>');
    b.textContent = o.t;
    b.addEventListener('click', () => answer(i, b));
    box.appendChild(b);
    return b;
  });

  function answer(i: number, btn: HTMLButtonElement) {
    const o = t.options[i]!;
    const outcome = answerData(s, o.ok, ctx.now());
    if (outcome === 'ignored') return;
    fb.hidden = false;
    fb.className = 'feedback ' + (o.ok ? 'ok' : 'no');
    fb.textContent = o.why;
    if (outcome === 'solved') {
      btn.classList.add('ok');
      return finishData();
    }
    btn.classList.add('no');
    btn.disabled = true;
    if (outcome === 'revealed') {
      opts[okIdx]!.classList.add('ok');
      fb.textContent = o.why + ' ' + t.revealed;
      finishData();
    }
  }
  function finishData() {
    setFab(false);
    opts.forEach(b => { b.disabled = true; });
    $(root, '#d-sql').textContent = SQL;
    $(root, '#d-sql-box').hidden = false;
    ctx.completed('data', true);
  }

  tabs.forEach(b => b.addEventListener('click', () => renderData(b.dataset.dview as DView)));
  fab.addEventListener('click', () => ctx.center(box));
  renderData('mesice', true);
  const offResize = ctx.onResize(updateFab);

  return {
    el: root,
    heading: $(root, 'h2'),
    show() {
      shown = true;
      io?.disconnect();
      if ('IntersectionObserver' in window) {
        // odpovědi schované pod lepicí hlavičkou nebo dolní lištou webu nejsou vidět
        io = new IntersectionObserver(([en]) => { optsVisible = !!en?.isIntersecting; updateFab(); },
          { threshold: 0.25, rootMargin: -ctx.topOffset() + 'px 0px ' + -ctx.bottomOffset() + 'px 0px' });
        io.observe(box);
      }
      updateFab();
    },
    hide() {
      shown = false;
      io?.disconnect();
      io = null;
      setFab(false);
    },
    destroy() {
      offResize();
      io?.disconnect();
      setFab(false);
    },
  };
}
