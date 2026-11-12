/* Části, které se v ukázkách opakují: hlavička úkolu, pruh po dokončení a další příklady. */
import cs from '../content/cs.json';
import type { State } from '../logic/state.ts';
import type { PathKey } from '../logic/types.ts';

/** Délka ukázky. IT admin trvá 2 minuty (Martinovo zadání UX-05), ostatní mají společnou. */
export const duration = (k: PathKey) => (k === 'kyber' ? cs.kyber.duration : cs.ui.duration);
const moreTime = (k: PathKey) => (k === 'kyber' ? cs.kyber.moreTime : cs.ui.moreTime);

export function viewHead(k: PathKey, note: string, title: string, sub = '', extra = ''): string {
  return '<div class="view-head"><p class="vtag"><span class="ptag">' + cs.start.cards[k].field + '</span><span>' + note + '</span></p>' +
    '<h2 tabindex="-1">' + title + '</h2>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + extra + '</div>';
}

/** Krémový pruh po dokončení ukázky s cestou k výsledku. Bez textu zbude jen tlačítko. */
export function doneBar(id: string, text = ''): string {
  const button = '<div class="btn-row"><button class="btn btn-primary" data-go="vysledek" type="button">' + cs.ui.myResult + '</button></div>';
  return text
    ? '<div class="done-bar" id="' + id + '" hidden><p>' + text + '</p>' + button + '</div>'
    : '<div class="done-bar bare" id="' + id + '" hidden>' + button + '</div>';
}

/** Karty ostatních ukázek: obor, název a stav, hotové odškrtnuté. */
export function otherCards(current: PathKey, offered: readonly PathKey[], s: State): string {
  return offered.filter(k => k !== current).map(k => {
    const st = s[k].status, c = cs.start.cards[k];
    const label = st === 'done' ? cs.ui.done : st === 'skipped' ? cs.ui.skipped : moreTime(k);
    return '<button type="button" class="other" data-go="' + k + '"><span class="o-text"><span class="o-field">' + c.field + '</span><b>' + c.title + '</b></span>' +
      '<span class="st' + (st === 'done' ? ' done' : '') + '">' + label + '</span></button>';
  }).join('');
}

/** Sekce „Zkus si další příklady“ pod ukázkou. Karty do ní doplňuje widget (renderProgress). */
export const moreSection = (current: PathKey) =>
  '<div class="more-ex"><h3>' + cs.ui.moreTitle + '</h3><div class="others" data-more="' + current + '"></div></div>';
