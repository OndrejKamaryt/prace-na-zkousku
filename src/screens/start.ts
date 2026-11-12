/* Úvod: modrý pás a karty nabízených ukázek. Stav na kartách překresluje
   widget (renderProgress). */
import cs from '../content/cs.json';
import config from '../content/config.json';
import { fill, kc } from '../logic/text.ts';
import type { PathKey } from '../logic/types.ts';
import type { Screen } from '../ui/ctx.ts';
import { $, el } from '../ui/dom.ts';
import { CARD_BLOB, CARD_ICON, DOODLES, HERO_ART, THEME } from '../ui/icons.ts';
import { duration } from '../ui/parts.ts';

function card(k: PathKey): string {
  const c = cs.start.cards[k];
  return '<button class="path-card ' + THEME[k] + '" data-go="' + k + '" type="button">' + CARD_BLOB + CARD_ICON[k] +
    '<span class="field-name">' + c.field + '</span><h3>' + c.title + '</h3><p class="desc">' + c.desc + '</p>' +
    '<span class="foot"><span>' + duration(k) + '</span><span class="go" data-state="' + k + '">' + cs.ui.try + '</span></span></button>';
}

export function createStart(offered: readonly PathKey[]): Screen {
  const t = cs.start;
  const root = el(`<section class="view" id="v-start">
  <div class="band-sky">${DOODLES}
    <div class="container hero">
      <div>
        <h1 tabindex="-1">${t.title}</h1>
        <p class="lede">${t.lede}</p>
        <div class="hero-meta">${t.meta.map(m => '<span>' + m + '</span>').join('')}</div>
        <p class="strip"><span class="ptag">${fill(t.stripTag, { cap: kc(config.digikurzy.cap) })}</span><span>${t.stripText}</span></p>
      </div>
      ${HERO_ART}
    </div>
  </div>
  <div class="container">
    <h2 class="sec-title">${t.pathsTitle}</h2>
    <div class="paths" style="--cards:${offered.length}">${offered.map(card).join('')}</div>
  </div>
</section>`);
  return { el: root, heading: $(root, 'h1') };
}
