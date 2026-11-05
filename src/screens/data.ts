/* Datová analýza: kavárna Zrnko jako práce analytika. Jana přijde s problémem a návštěvník
   rozhoduje, co udělá dál: stáhne data, sečte měsíce, porovná dny a produkty a napíše Janě
   závěr. Špatná volba zmizí a Jana k ní řekne svoje, po dvou špatných se rozsvítí správná:
   cílem není ukázku vyřešit, ale projít si, jak analytik postupuje. */
import cs from '../content/cs.json';
import { RECEIPTS, SQL, SQL_CHART } from '../content/fixtures.ts';
import { answerData, finishData } from '../logic/state.ts';
import { kc, nf } from '../logic/text.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, $$, el } from '../ui/dom.ts';
import { DATA_ICON, type DataIcon } from '../ui/icons.ts';
import { doneBar, moreSection, viewHead } from '../ui/parts.ts';

interface Option { icon: DataIcon; t: string; ok?: boolean; why?: string }
interface Choose { scene?: 'jana' | 'raw'; q: string; options: Option[] }
interface Bar { label: string; name?: string; a: number; b?: number; why?: string }
interface Pick { chart: keyof typeof SQL_CHART; q: string; right: number[]; chip?: string; clue: string; found: string; rows: Bar[] }
type Step = Choose | Pick;

const STEPS = cs.data.steps as unknown as Step[];
const isPick = (s: Step): s is Pick => 'chart' in s;
const RECEIPT_COUNT = 9660;
const TICKS = 26, TICK_MS = 48;
const pct = (v: number, max: number) => (v / max * 100).toFixed(1) + '%';

/** Měsíce: jedna řada sloupců s částkou. */
function monthsChart(rows: Bar[]): string {
  const max = Math.max(...rows.map(r => r.a));
  return '<div class="dcols" id="d-chart">' + rows.map((r, i) =>
    '<button type="button" class="dcol" data-bar="' + i + '" aria-label="' + r.label + ': ' + kc(r.a) + '"><span class="dplot"><span class="dbar" style="height:' + pct(r.a, max) + ';--i:' + i + '"></span></span><span class="dval">' + kc(r.a) + '</span><span class="dlab">' + r.label + '</span></button>').join('') + '</div>';
}

/** Dny: dvojice sloupců únor a březen, s částkami až pro čtečku, na šířku se nevejdou. */
function daysChart(rows: Bar[]): string {
  const max = Math.max(...rows.flatMap(r => [r.a, r.b ?? 0]));
  const t = cs.data;
  return '<div class="dcols" id="d-chart">' + rows.map((r, i) =>
    '<button type="button" class="dcol" data-bar="' + i + '" aria-label="' + r.name + ': ' + t.legendFeb + ' ' + kc(r.a) + ', ' + t.legendMar + ' ' + kc(r.b ?? 0) + '"><span class="dplot"><span class="dbar feb" style="height:' + pct(r.a, max) + ';--i:' + i + '"></span><span class="dbar" style="height:' + pct(r.b ?? 0, max) + ';--i:' + i + '"></span></span><span class="dlab">' + r.label + '</span></button>').join('') + '</div>';
}

/** Produkty: vodorovné dvojice s částkami, názvy jsou na sloupce moc dlouhé. */
function productsChart(rows: Bar[]): string {
  const max = Math.max(...rows.flatMap(r => [r.a, r.b ?? 0]));
  const line = (v: number, cls: string, i: number) =>
    '<span class="dline"><span class="dtrack"><span class="dbar' + cls + '" style="width:' + pct(v, max) + ';--i:' + i + '"></span></span><span>' + kc(v) + '</span></span>';
  return '<div class="drows" id="d-chart">' + rows.map((r, i) =>
    '<button type="button" class="drow" data-bar="' + i + '"><span class="dlab">' + r.label + '</span><span class="dlines">' + line(r.a, ' feb', i) + line(r.b ?? 0, '', i) + '</span></button>').join('') + '</div>';
}

const CHARTS = { months: monthsChart, days: daysChart, products: productsChart };

export function createData(ctx: Ctx): Screen {
  const t = cs.data, s = ctx.state;
  const root = el(`<section class="view t-data" id="v-data" hidden><div class="container">
  <div class="data-col">
    ${viewHead('data', cs.ui.duration, t.title)}
    <div class="clues" id="d-clues" role="group" aria-label="${t.cluesLabel}">${t.clues.map(c => '<div class="clue"><span>' + c + '</span><b>?</b></div>').join('')}</div>
    <div class="stage" id="d-step" data-scene="jana">
      <div class="stage-bar" aria-hidden="true"><i id="d-bar"></i></div>
      <div id="d-vis"></div>
      <div id="d-ask" hidden>
        <p class="found" id="d-found" aria-live="polite" hidden></p>
        <p class="stage-q" id="d-q" tabindex="-1"></p>
        <div class="acts" id="d-options"></div>
        <div class="say" id="d-fb" aria-live="polite" hidden></div>
      </div>
    </div>
    ${doneBar('d-done', t.done)}
    ${moreSection('data')}
  </div>
</div></section>`);
  const stage = $(root, '#d-step'), vis = $(root, '#d-vis'), ask = $(root, '#d-ask');
  const found = $(root, '#d-found'), question = $(root, '#d-q'), options = $(root, '#d-options'), fb = $(root, '#d-fb');
  const clueBox = $(root, '#d-clues');
  let current = 0, clueNo = 0, started = false;

  const dots = '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>';
  const bubble = (text: string) => '<div class="chat"><span class="jana" aria-hidden="true">' + t.who + '</span><div class="bub"><small>' + t.jana + '</small><span id="d-jana" aria-live="polite">' + text + '</span></div></div>';

  // obrazovka může být mezitím schovaná: posouvat stránku smí jen ta, která je vidět
  const align = (target: Element) => { if (!root.hidden) ctx.alignTop(target); };
  const keep = (target: Element) => { if (!root.hidden) ctx.keepVisible(target); };

  function renderAsk(step: Step, text = '') {
    ask.hidden = false;
    found.hidden = !text;
    found.innerHTML = text ? DATA_ICON.check + '<span>' + text + '</span>' : '';
    question.textContent = step.q;
    options.innerHTML = isPick(step) ? '' : step.options.map((o, n) =>
      '<button type="button" class="act" data-opt="' + n + '" style="--i:' + n + '">' + DATA_ICON[o.icon] + '<span>' + o.t + '</span></button>').join('');
    fb.hidden = true;
    fb.innerHTML = '';
  }

  /** Jana reaguje na špatnou volbu. Po druhé špatné přidá, že správná odpověď svítí. */
  function say(text: string, revealed: boolean) {
    fb.hidden = false;
    fb.innerHTML = '<span class="jana small" aria-hidden="true">' + t.who + '</span><p>' + text + (revealed ? ' ' + t.revealed : '') + '</p>';
    keep(fb);
  }

  function typeSql(text: string) {
    const box = $(vis, '.sql');
    if (ctx.reduce) {
      box.textContent = text;
      box.classList.add('end');
      return;
    }
    let n = 0;
    const timer = setInterval(() => {
      box.textContent = text.slice(0, ++n);
      if (n < text.length) return;
      clearInterval(timer);
      box.classList.add('end');
    }, 16);
  }

  /** Stahování: počítadlo běží, řádky z pokladny přibývají navrchu. */
  function download(): Promise<void> {
    vis.innerHTML = '<div class="file"><span>' + t.file + '</span><b id="d-count">0</b></div><div class="load" aria-hidden="true"><i id="d-load"></i></div><div class="tbl" id="d-rows" aria-hidden="true"></div>';
    const rows = $(vis, '#d-rows'), count = $(vis, '#d-count'), load = $(vis, '#d-load');
    const ticks = ctx.reduce ? 1 : TICKS;
    return new Promise(done => {
      let k = 0;
      const tick = () => {
        k++;
        const p = k / ticks;
        count.textContent = nf(Math.round(RECEIPT_COUNT * p));
        load.style.width = p * 100 + '%';
        for (let n = ctx.reduce ? 6 : 1; n > 0; n--) {
          const r = RECEIPTS[(k + n) % RECEIPTS.length]!;
          rows.insertAdjacentHTML('afterbegin', '<div><span>' + r[0] + '</span><span>' + r[1] + '</span><span>' + kc(r[2]) + '</span></div>');
        }
        while (rows.children.length > 6) rows.lastElementChild!.remove();
        if (k < ticks) return void setTimeout(tick, TICK_MS);
        count.textContent = t.receipts;
        done();
      };
      tick();
    });
  }

  function drawChart(step: Pick) {
    const pair = step.chart !== 'months';
    const legend = pair ? '<div class="legend"><span><i class="sw feb"></i>' + t.legendFeb + '</span><span><i class="sw"></i>' + t.legendMar + '</span></div>' : '';
    vis.innerHTML = '<div class="sql" aria-hidden="true"></div>' + legend + CHARTS[step.chart](step.rows);
    $(vis, '#d-chart').classList.add('pick');
    typeSql(SQL_CHART[step.chart]);
  }

  const progress = (i: number) => { $(root, '#d-bar').style.width = i / STEPS.length * 100 + '%'; };

  async function enter(i: number) {
    current = i;
    const step = STEPS[i]!;
    progress(i);
    ask.hidden = true;
    if (isPick(step)) {
      stage.dataset.scene = 'chart';
      drawChart(step);
      renderAsk(step);
      align(clueBox);
    } else {
      if (step.scene) stage.dataset.scene = step.scene;
      align(clueBox);
      if (step.scene === 'raw') await download();
      renderAsk(step);
      keep(options);
    }
    if (!root.hidden) question.focus({ preventScroll: true });
  }

  async function choose(i: number, btn: HTMLButtonElement) {
    const step = STEPS[current] as Choose, o = step.options[i]!;
    const outcome = answerData(s, !!o.ok, ctx.now());
    if (outcome === 'ignored') return;
    const all = $$<HTMLButtonElement>(options, '.act');
    if (outcome !== 'solved') {
      btn.classList.add('no');
      btn.disabled = true;
      if (outcome === 'revealed') {
        all.forEach((b, n) => {
          if (step.options[n]!.ok) b.classList.add('lit');
          else b.disabled = true;
        });
      }
      all.find(b => !b.disabled)?.focus({ preventScroll: true });
      return say(o.why ?? '', outcome === 'revealed');
    }
    all.forEach(b => { b.disabled = true; });
    btn.classList.remove('lit');
    btn.classList.add('ok');
    fb.hidden = true;
    await ctx.wait(420);
    if (step.scene === 'raw') {
      $(vis, '#d-rows').classList.add('gone');
      await ctx.wait(380);
    }
    if (current === STEPS.length - 1) return end(o.t);
    return enter(current + 1);
  }

  function pick(n: number, btn: HTMLButtonElement) {
    const chart = $(vis, '#d-chart');
    if (!chart.classList.contains('pick')) return;
    const step = STEPS[current] as Pick;
    const bars = $$<HTMLButtonElement>(chart, '[data-bar]');
    const right = step.right.includes(n);
    const outcome = answerData(s, right, ctx.now());
    if (outcome === 'ignored') return;
    if (!right) {
      btn.classList.add('tried');
      btn.disabled = true;
      if (outcome === 'revealed') {
        bars.forEach((b, r) => {
          if (step.right.includes(r)) b.classList.add('lit');
          else b.disabled = true;
        });
      }
      bars.find(b => !b.disabled)?.focus({ preventScroll: true });
      return say(step.rows[n]!.why ?? '', outcome === 'revealed');
    }
    chart.classList.remove('pick');
    chart.classList.add('dimmed');
    bars.forEach(b => { b.disabled = true; });
    step.right.forEach(r => {
      const b = bars[r]!;
      b.classList.remove('lit');
      b.classList.add('hit');
    });
    if (step.chip) bars[step.right.at(-1)!]!.insertAdjacentHTML('afterbegin', '<span class="dchip">' + step.chip + '</span>');
    const clue = $$(clueBox, '.clue')[clueNo++]!;
    clue.classList.add('on');
    $(clue, 'b').textContent = step.clue;
    current++;
    progress(current);
    renderAsk(STEPS[current]!, step.found);
    keep(options);
    question.focus({ preventScroll: true });
  }

  /** Zpráva Janě, její odpověď a výsledek ukázky. Hotovo je to hned, výsledek se ukáže po odpovědi. */
  async function end(message: string) {
    finishData(s, ctx.now());
    progress(STEPS.length);
    stage.dataset.scene = 'solved';
    ask.hidden = true;
    vis.innerHTML = '<div class="chat me"><div class="bub">' + message + '</div></div>' + bubble(dots) + '<div class="solved" id="d-sol"></div>';
    align(stage);
    await ctx.wait(1000);
    $(vis, '#d-jana').textContent = t.closing;
    await ctx.wait(500);
    const sol = $(vis, '#d-sol');
    sol.innerHTML =
      '<p class="solved-t" id="d-end" tabindex="-1">' + t.resultTitle + '</p>' +
      '<p class="solved-sum" id="d-lost">' + kc(ctx.reduce ? t.lost : 0) + '</p>' +
      '<p>' + t.resultMoney + '</p><p class="hint-t">' + t.resultHint + '</p>' +
      '<details class="more" id="d-sql-box"><summary>' + t.sqlSummary + '</summary><p class="fine" style="margin-top:8px">' + t.sqlIntro + '</p><pre class="code" id="d-sql"></pre><p class="fine" style="margin-top:8px">' + t.sqlOutro + '</p></details>';
    $(sol, '#d-sql').textContent = SQL;
    countUp($(sol, '#d-lost'));
    ctx.completed('data', false);
    keep($(root, '#d-done'));
    if (!root.hidden) $(sol, '#d-end').focus({ preventScroll: true });
  }

  function countUp(box: HTMLElement) {
    if (ctx.reduce) return;
    const start = performance.now(), length = 900;
    const step = (time: number) => {
      const p = Math.min(1, (time - start) / length), eased = 1 - (1 - p) ** 3;
      box.textContent = kc(Math.round(t.lost * eased / 100) * 100);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  stage.addEventListener('click', e => {
    const tg = e.target as Element;
    const opt = tg.closest<HTMLButtonElement>('[data-opt]');
    if (opt) return void choose(Number(opt.dataset.opt), opt);
    const bar = tg.closest<HTMLButtonElement>('[data-bar]');
    if (bar) pick(Number(bar.dataset.bar), bar);
  });

  vis.innerHTML = bubble(dots);

  return {
    el: root,
    heading: $(root, 'h2'),
    // Jana začne psát až ve chvíli, kdy je ukázka opravdu vidět
    async show() {
      if (started) return;
      started = true;
      await ctx.wait(900);
      $(vis, '#d-jana').textContent = t.opening;
      renderAsk(STEPS[0]!);
    },
  };
}
