/* Co dostane obchod: věta do telefonu a řádky poznámky na dealu.
   Sdílí ji widget i endpoint, který poznámku skládá na serveru. */
import cs from '../content/cs.json';
import { bestApp } from './rating.ts';
import { notFun, recommend, why } from './recommend.ts';
import { fill, plural } from './text.ts';
import { PATHS } from './types.ts';
import type { PathKey, Snapshot } from './types.ts';

/** Návrh první věty do telefonu. */
export function opener(s: Snapshot): string {
  const k = recommend(s);
  const o = cs.opener, p = s.paths;
  if (!k) return o.none;
  if (notFun(s, k)) return fill(o.notFun, { label: cs.paths[k].label });
  if (k === 'data') return fill(o.data, { firstTry: p.data.firstTry ? o.dataFirstTry : '' });
  if (k === 'ai') {
    const app = bestApp(p.ai);
    const n = app?.changes ?? 0;
    const changes = n ? fill(o.aiChanges, { n, word: plural(n, o.aiChangeWord) }) : '';
    return fill(o.ai, { name: app ? cs.ideas[app.idea] : '', changes });
  }
  if (k === 'hry') {
    if (p.hry.status === 'skipped') return o.hrySkipped;
    return fill(o.hry, { won: p.hry.ownWon ? o.hryWon : '' });
  }
  return fill(o.kyber, { clean: p.kyber.firstOk >= 3 ? o.kyberClean : '' });
}

export interface NoteRow {
  label: string;
  values: string[];
}

function entryText(s: Snapshot): string {
  const e = cs.sales.entry;
  if (s.entry === 'start' || s.entrySource === 'default') return e.start;
  return fill(s.entrySource === 'url' ? e.url : e.attr, { label: cs.paths[s.entry].label });
}

function favText(s: Snapshot): string {
  const f = cs.sales.fav;
  if (s.fav === null) return f.none;
  if (s.fav === 'unknown') return f.unknown;
  if (s.fav.startsWith('not:')) return fill(f.not, { label: cs.paths[s.fav.slice(4) as PathKey].label });
  return cs.paths[s.fav as PathKey].label;
}

function duration(seconds: number): string {
  return fill(cs.sales.time, { m: Math.floor(seconds / 60), s: String(seconds % 60).padStart(2, '0') });
}

function pathValues(k: PathKey, s: Snapshot): string[] {
  const st = s.paths[k].status;
  const tag = cs.sales.status[st];
  return st === 'done' || st === 'skipped' ? [tag, ...why(k, s)] : [tag];
}

/** Řádky poznámky „Práce na zkoušku“. Zájem o školení přes firmu má vlastní nadpis nad nimi. */
export function noteRows(s: Snapshot): NoteRow[] {
  const r = cs.sales.rows, t = cs.sales;
  const k = recommend(s);
  const row = (label: string, ...values: string[]): NoteRow => ({ label, values });
  return [
    row(r.entry, entryText(s)),
    ...(s.page ? [row(r.page, s.page)] : []),
    row(r.recommended, k ? fill(t.recommended, { label: cs.paths[k].label, course: cs.paths[k].course }) : t.recommendedNone),
    row(r.fav, favText(s)),
    row(r.goal, s.goal ? t.goal[s.goal] : t.goal.none),
    row(r.firm, s.firmInterest ? t.firm.yes : t.firm.no),
    ...PATHS.map(x => row(cs.paths[x].label, ...pathValues(x, s))),
    row(r.time, duration(s.secondsTotal)),
    row(r.lowIncome, s.lowIncome === null ? t.lowIncome.notAsked : s.lowIncome ? t.lowIncome.yes : t.lowIncome.no),
  ];
}

export const firmHeadline = (s: Snapshot) => (s.firmInterest ? cs.sales.firmHeadline : null);

/** Čitelná textová podoba poznámky, pro DRY_RUN a testy. HTML pro Pipedrive skládá endpoint. */
export function noteText(s: Snapshot): string {
  const lines: string[] = [];
  const head = firmHeadline(s);
  if (head) lines.push(head.toUpperCase(), '');
  for (const r of noteRows(s)) lines.push(r.label + ': ' + r.values.join(', '));
  lines.push('', cs.sales.rows.opener + ': ' + opener(s));
  return lines.join('\n');
}
