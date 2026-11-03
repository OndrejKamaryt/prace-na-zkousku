/* Části, které se v ukázkách opakují: hlavička úkolu, pruh s vyzvednutím odznaku a odznak. */
import cs from '../content/cs.json';
import type { PathKey } from '../logic/types.ts';
import { BADGE_ICON, THEME } from './icons.ts';

export function viewHead(k: PathKey, note: string, title: string, sub = '', extra = ''): string {
  return '<div class="view-head"><div class="vh-top"><button class="linkish back" data-go="start" type="button">' + cs.ui.back + '</button>' +
    '<p class="vtag"><span class="ptag">' + cs.start.cards[k].field + '</span><span>' + note + '</span></p></div>' +
    '<h2 tabindex="-1">' + title + '</h2>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + extra + '</div>';
}

/** Krémový pruh „Hotovo“. Po vyzvednutí odznaku se místo tlačítka ukážou dvě další. */
export function claimBar(k: PathKey, id: string, text: string): string {
  return '<div class="claim" id="' + id + '" hidden><p>' + text + '</p><div class="btn-row">' +
    '<button class="btn btn-primary" type="button" data-claim="' + k + '">' + cs.ui.claim + '</button>' +
    '<button class="btn btn-ghost" data-go="start" type="button" hidden>' + cs.ui.nextWork + '</button>' +
    '<button class="btn btn-primary" data-go="vysledek" type="button" hidden>' + cs.ui.myResult + '</button></div></div>';
}

export const badgeHtml = (k: PathKey, got: boolean) =>
  '<span class="badge ' + THEME[k] + (got ? ' got' : '') + '"><i>' + BADGE_ICON[k] + '</i>' + cs.paths[k].badge + '</span>';
