/* Analytika IT admina (Martinovo zadání UX-12, rozhodnutí Ondřeje 12. 11.).
   Událost se vyvolá na prvku widgetu jako CustomEvent a když ukázka běží
   v iframe, pošle se i stránce nad ní přes postMessage. Web Coders Labu ji
   přepošle do GTM, ukázka posluchače je v PREDANI.md. Posílají se jen názvy
   kroků, čísla a klíče voleb: žádné osobní údaje, žádné cookies. Stav
   hostitelské stránky se nemění. */

/** Odesílatel ve zprávě i název CustomEventu. */
export const TRACK_SOURCE = 'prace-na-zkousku';

export type TrackEvent =
  | 'game_view' | 'game_start' | 'step_complete' | 'wrong_answer' | 'game_finish'
  | 'result_cta_click' | 'webinar_click' | 'course_detail_click' | 'replay_click';

export type TrackData = Record<string, string | number | boolean>;

export interface TrackDetail extends TrackData {
  source: typeof TRACK_SOURCE;
  event: TrackEvent;
  game: 'kyber';
}

export function track(host: HTMLElement, event: TrackEvent, data: TrackData = {}): void {
  const detail: TrackDetail = { ...data, source: TRACK_SOURCE, event, game: 'kyber' };
  host.dispatchEvent(new CustomEvent(TRACK_SOURCE, { detail, bubbles: true, composed: true }));
  if (window.parent === window) return;
  try {
    // obsah není citlivý, proto '*': ukázka neví, na které doméně ji web vloží
    window.parent.postMessage(detail, '*');
  } catch {
    /* stránka nad iframe zprávu nepřijme, ukázka hraje dál */
  }
}
