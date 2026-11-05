/* Doporučený směr a důvody, jako best(), score() a why() v prototypu. */
import cs from '../content/cs.json';
import { bestApp } from './rating.ts';
import { fill } from './text.ts';
import { PATHS } from './types.ts';
import type { PathKey, Snapshot } from './types.ts';

/** Ukázky, ze kterých se vybírá: hotové, a když žádná není, přeskočené. */
export function candidates(s: Snapshot): PathKey[] {
  const done = PATHS.filter(k => s.paths[k].status === 'done');
  return done.length ? done : PATHS.filter(k => s.paths[k].status === 'skipped');
}

export function score(k: PathKey, s: Snapshot): number {
  const p = s.paths;
  // kdo ukázku dokončil, prošel všechny kroky, takže dřívějších 0,5 za prohlédnuté pohledy platí vždy
  if (k === 'data') return 2.5 + (p.data.firstTry ? 1 : 0);
  if (k === 'ai') return 2 + Math.min(bestApp(p.ai)?.changes ?? 0, 2) * 0.5;
  if (k === 'hry') return 2 + (p.hry.defaultWon || p.hry.ownWon ? 1 : 0) + (p.hry.edits >= 5 ? 0.5 : 0);
  return 2 + p.kyber.firstOk * 0.4;
}

export const ENTRY_BONUS = 1.5;

export function recommend(s: Snapshot): PathKey | null {
  const ks = candidates(s);
  if (!ks.length) return null;
  if (s.fav && (PATHS as readonly string[]).includes(s.fav) && ks.includes(s.fav as PathKey)) return s.fav as PathKey;
  let best = ks[0]!, bestScore = -1;
  for (const k of ks) {
    const sc = score(k, s) + (s.entry === k ? ENTRY_BONUS : 0);
    if (sc > bestScore) { bestScore = sc; best = k; }
  }
  return best;
}

/** „Spíš ne“ platí jen pro ukázku, u které padlo. */
export const notFun = (s: Snapshot, k: PathKey) => s.fav === 'not:' + k;

const minutes = (seconds: number) => Math.max(1, Math.round(seconds / 60));

export function why(k: PathKey, s: Snapshot): string[] {
  const w = cs.why, p = s.paths;
  if (k === 'data') {
    const d = p.data;
    return [
      d.revealed ? w.dataRevealed : d.firstTry ? w.dataFirstTry : fill(w.dataMistakes, { n: d.mistakes }),
      fill(w.time, { min: minutes(d.seconds) }),
    ];
  }
  if (k === 'ai') {
    const app = bestApp(p.ai);
    if (!app) return [];
    return [
      fill(w.aiBuilt, { name: cs.ideas[app.idea] }),
      fill(w.aiChanges, { changes: app.changes }),
      p.ai.ideasTried > 1 ? fill(w.aiIdeas, { ideas: p.ai.ideasTried }) : '',
    ].filter(Boolean);
  }
  if (k === 'hry') {
    const h = p.hry;
    if (h.status === 'skipped' && !h.ownWon) return [w.hrySkipped, fill(w.hryEdits, { edits: h.edits })];
    const won = h.defaultWon || h.ownWon;
    return [
      h.ownWon ? fill(w.hryOwnWon, { attempt: h.winAttempt }) : won ? w.hryDefaultWon : fill(w.hryPlays, { plays: h.plays }),
      fill(w.hryEdits, { edits: h.edits }),
      won ? fill(w.hryCoins, { coins: h.bestCoins }) : '',
    ].filter(Boolean);
  }
  return [w.kyberDone, fill(w.kyberFirstOk, { firstOk: p.kyber.firstOk })];
}
