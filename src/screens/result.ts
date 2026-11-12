/* Výsledek v jednom sloupci: doporučený obor, cena s příspěvkem, Co dál a další
   příklady. Panel „Pohled obchodníka“ z prototypu se nepřebírá, jeho obsah jde
   do Pipedrivu (fáze 4 a 5). Otázky co bavilo, co od kurzu čekáš a školení přes
   firmu jsou od 4. 11. pryč, ve stavu a snímku zůstávají prázdné. */
import cs from '../content/cs.json';
import config from '../content/config.json';
import { lowIncomeMatters, priceFor } from '../logic/price.ts';
import { candidates, recommend } from '../logic/recommend.ts';
import { lowIncomeShown, setLowIncome, snapshot } from '../logic/state.ts';
import { fill, kc } from '../logic/text.ts';
import { NBSP } from '../logic/typography.ts';
import type { PathKey } from '../logic/types.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, el } from '../ui/dom.ts';
import { otherCards } from '../ui/parts.ts';
import { track } from '../ui/track.ts';
import type { TrackEvent } from '../ui/track.ts';

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
  <div id="r-full" class="result-col" hidden>
    <div class="reco" id="r-reco"></div>
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
      <p class="small-link" id="r-new-tab">${t.newTab}</p>
      <p class="small-link">${t.consultIntro} <a href="${config.links.konzultace}" ${LINK}>${t.consultLink}</a>.</p>
    </div>
    <div class="more-ex" id="r-others-box">
      <h3>${cs.ui.moreTitle}</h3>
      <div class="others" id="r-others"></div>
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

  function render() {
    const snap = snapshot(s, ctx.now());
    const ds = candidates(snap);
    empty.hidden = ds.length > 0;
    full.hidden = ds.length === 0;
    const k = recommend(snap);
    current = k;
    if (!k) return;
    const p = cs.paths[k];
    reco.innerHTML = '<p class="tagline">' + (ds.length > 1 ? t.taglineStrong : t.taglineFirst) + '</p><h2 tabindex="-1">' + p.label + '</h2><p class="desc">' + p.desc + '</p>';

    const next = config.courses[k].next as keyof typeof cs.cta;
    $(root, '#r-next-text').textContent = p.nextText;
    $(root, '#r-next').innerHTML = '<a class="btn btn-primary" href="' + config.links[next] + '" ' + LINK + (next === 'webinar' ? ' data-track="webinar_click"' : '') + '>' + cs.cta[next] + '</a>' +
      '<a class="btn btn-ghost" href="' + config.courses[k].url + '" ' + LINK + ' data-track="course_detail_click">' + t.detail + '</a>';
    const others = otherCards(k, ctx.offered, s);
    $(root, '#r-others').innerHTML = others;
    $(root, '#r-others-box').hidden = !others;
    renderPrice(k);
  }

  // analytika IT admina: webinář a detail kurzu se měří, jen když výsledek doporučuje kyberbezpečnost
  $(root, '#r-next').addEventListener('click', e => {
    const a = (e.target as Element).closest<HTMLElement>('[data-track]');
    if (a && current === 'kyber') track(ctx.host, a.dataset.track as TrackEvent);
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
