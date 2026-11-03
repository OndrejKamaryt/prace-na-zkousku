/* Výsledek: doporučený směr, cena s příspěvkem, další krok a ostatní ukázky.
   Panel „Pohled obchodníka“ z prototypu se nepřebírá, jeho obsah jde do
   Pipedrivu (fáze 4 a 5). Pořadí bloků v DOM odpovídá mobilu (S8). */
import cs from '../content/cs.json';
import config from '../content/config.json';
import { lowIncomeMatters, priceFor } from '../logic/price.ts';
import { candidates, notFun, recommend, why } from '../logic/recommend.ts';
import { isDone, lowIncomeShown, setFav, setFirm, setGoal, setLowIncome, snapshot } from '../logic/state.ts';
import { fill, kc } from '../logic/text.ts';
import { NBSP } from '../logic/typography.ts';
import { PATHS } from '../logic/types.ts';
import type { Fav, Goal, PathKey } from '../logic/types.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, el, esc } from '../ui/dom.ts';
import { THEME } from '../ui/icons.ts';
import { badgeHtml } from '../ui/parts.ts';

const LINK = 'target="_blank" rel="noopener"';
const rate = (r: number) => (r * 100).toLocaleString('cs-CZ', { maximumFractionDigits: 2 }) + NBSP + '%';

export function createResult(ctx: Ctx): Screen {
  const t = cs.result, s = ctx.state;
  const root = el(`<section class="view" id="v-vysledek" hidden><div class="container">
  <div id="r-empty" class="panel empty-state" hidden>
    <h2 tabindex="-1">${t.emptyTitle}</h2>
    <p class="hint">${t.emptyHint}</p>
    <button class="btn btn-primary" data-go="start" type="button">${t.emptyCta}</button>
  </div>
  <div id="r-full" hidden>
    <div class="result-grid">
      <div class="reco" id="r-reco"></div>
      <div class="r-side" id="r-side">
        <div class="panel" id="r-price-box">
          <h3 id="r-price-title">${t.priceTitleDefault}</h3>
          <div class="price" id="r-price"></div>
          <ul class="facts">${t.facts.map(f => '<li>' + f + '</li>').join('')}</ul>
          <label class="lowinc"><input type="checkbox" id="r-lowinc"><span>${t.lowIncome}</span></label>
          <details class="more"><summary>${t.fineSummary}</summary><div class="fine" id="r-fine" style="margin-top:10px"></div></details>
          <p class="proof">${t.proof}</p>
        </div>
        <div class="panel" id="r-next-box">
          <h3>${t.nextTitle}</h3>
          <p class="hint" id="r-next-text"></p>
          <div class="btn-row" style="margin-top:12px" id="r-next"></div>
          <p class="small-link">${t.consultIntro} <a href="${config.links.konzultace}" ${LINK}>${t.consultLink}</a>.</p>
        </div>
      </div>
      <div class="panel" id="r-others-box">
        <h3>${t.othersTitle}</h3>
        <div class="others" id="r-others"></div>
      </div>
    </div>
  </div>
</div></section>`);

  const empty = $(root, '#r-empty'), full = $(root, '#r-full'), reco = $(root, '#r-reco');
  const lowinc = $<HTMLInputElement>(root, '#r-lowinc');
  let current: PathKey | null = null;

  function renderPrice(k: PathKey) {
    const c = cs.paths[k], pr = priceFor(k, s.lowIncome === true);
    const cap = kc(config.digikurzy.cap);
    $(root, '#r-price-title').textContent = fill(t.priceTitle, { course: c.course });
    const matters = lowIncomeMatters(k);
    lowinc.closest('label')!.hidden = !matters;
    if (matters) lowIncomeShown(s);
    lowinc.checked = s.lowIncome === true;
    $(root, '#r-price').innerHTML =
      '<span class="plabel">' + t.payLabel + '</span>' +
      '<div class="prow"><span class="pbig">' + kc(pr.pay) + '</span><span class="ptag">' + fill(t.contribTag, { contrib: kc(pr.contrib) }) + '</span></div>' +
      '<p class="psmall">' + fill(t.regular, { price: kc(pr.price) }) + ' ' + (pr.pay === 0 ? t.payZero : fill(t.payPart, { contrib: kc(pr.contrib) })) + '</p>';
    $(root, '#r-fine').innerHTML =
      '<p>' + fill(t.fineIntro, { rate: rate(config.digikurzy.rate), cap }) + '</p>' +
      '<ol class="steps-list">' + t.fineSteps.map(x => '<li>' + x + '</li>').join('') + '</ol>' +
      '<p>' + fill(t.fineGroups, { cap }) + '</p>' +
      '<p>' + fill(t.fineLimit, { cap }) + '</p>';
  }

  function render(focus?: string) {
    const snap = snapshot(s, ctx.now());
    const ds = candidates(snap);
    empty.hidden = ds.length > 0;
    full.hidden = ds.length === 0;
    const k = recommend(snap);
    current = k;
    if (!k) return;
    const p = cs.paths[k], nope = notFun(snap, k);
    let h = '<p class="tagline">' + (nope ? t.taglineNotFun : ds.length > 1 ? t.taglineStrong : t.taglineFirst) + '</p><h2 tabindex="-1">' + p.label + '</h2>' +
      '<p class="desc">' + (nope ? t.notFunDesc : s.goal === 'upskill' ? p.descUp : p.desc) + '</p>' +
      '<ul class="why">' + why(k, snap).map(x => '<li>' + esc(x) + '</li>').join('') +
      (s.fav === k ? '<li>' + (ds.length > 1 ? t.favMost : t.favOne) + '</li>' : '') + '</ul>' +
      '<div class="badges">' + PATHS.map(x => badgeHtml(x, isDone(s, x))).join('') + '</div>';
    const favBtn = (value: string, label: string) => '<button type="button" data-fav="' + value + '" aria-pressed="' + (s.fav === value) + '">' + label + '</button>';
    if (ds.length >= 2) {
      h += '<p class="fav-q">' + t.qFavMany + '</p><div class="fav">' + ds.map(x => favBtn(x, cs.paths[x].label)).join('') + favBtn('unknown', t.favUnknown) + '</div>';
    } else {
      h += '<p class="fav-q">' + t.qFavOne + '</p><div class="fav">' + favBtn(ds[0]!, t.favYes) + favBtn('not:' + ds[0], t.favNo) + '</div>';
    }
    const goalBtn = (value: string, label: string) => '<button type="button" data-goal="' + value + '" aria-pressed="' + (s.goal === value) + '">' + label + '</button>';
    h += '<p class="fav-q">' + t.qGoal + '</p><div class="goal">' + goalBtn('switch', t.goalSwitch) + goalBtn('upskill', t.goalUpskill) + '</div>';
    if (s.goal === 'upskill') {
      h += '<div class="firm"><h4>' + t.firmTitle + '</h4><p class="hint">' + t.firmText + '</p>' +
        '<label class="lowinc"><input type="checkbox" id="r-firm"' + (s.firm ? ' checked' : '') + '><span>' + t.firmCheck + '</span></label>' +
        '<p class="small-link"><a href="' + config.links.skoleniFirmy + '" ' + LINK + '>' + t.firmLink + '</a></p></div>';
    }
    reco.className = 'reco ' + THEME[k];
    reco.innerHTML = h;
    if (focus) reco.querySelector<HTMLElement>(focus)?.focus({ preventScroll: true });

    const next = config.courses[k].next as keyof typeof cs.cta;
    $(root, '#r-next-text').textContent = p.nextText;
    $(root, '#r-next').innerHTML = '<a class="btn btn-primary" href="' + config.links[next] + '" ' + LINK + '>' + cs.cta[next] + '</a>' +
      '<a class="btn btn-ghost" href="' + config.courses[k].url + '" ' + LINK + '>' + t.detail + '</a>';
    $(root, '#r-others').innerHTML = PATHS.filter(x => x !== k).map(x => {
      const st = s[x].status;
      const label = st === 'done' ? cs.ui.done : st === 'skipped' ? cs.ui.skipped : t.otherTime;
      return '<button type="button" class="other ' + THEME[x] + '" data-go="' + x + '"><span>' + cs.paths[x].label + '</span><span class="st' + (st === 'done' ? ' done' : '') + '">' + label + '</span></button>';
    }).join('');
    renderPrice(k);
  }

  reco.addEventListener('click', e => {
    const tg = e.target as Element;
    const f = tg.closest<HTMLElement>('[data-fav]');
    if (f) {
      setFav(s, f.dataset.fav as Fav);
      return render('[data-fav="' + f.dataset.fav + '"]');
    }
    const g = tg.closest<HTMLElement>('[data-goal]');
    if (g) {
      setGoal(s, g.dataset.goal as Goal);
      render('[data-goal="' + g.dataset.goal + '"]');
    }
  });
  reco.addEventListener('change', e => {
    const tg = e.target as HTMLInputElement;
    if (tg.id === 'r-firm') setFirm(s, tg.checked);
  });
  lowinc.addEventListener('change', () => {
    setLowIncome(s, lowinc.checked);
    if (current) renderPrice(current);
  });

  return {
    el: root,
    get heading() {
      return root.querySelector<HTMLElement>(full.hidden ? '#r-empty h2' : '#r-reco h2');
    },
    show() { render(); },
  };
}
