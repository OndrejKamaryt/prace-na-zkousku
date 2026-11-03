/* Slučování snímků na serveru (PLAN.md, rozhodnutí 8 a 10). Výsledek se
   ukládá do skrytého pole dealu „PNZ stav“ a z něj se pak počítají hodnocení,
   doporučení i poznámka. */
import { rate } from './rating.ts';
import { PATHS } from './types.ts';
import type { PathKey, PathSnaps, Snapshot, Status } from './types.ts';

export interface SessionInfo {
  seconds: number;
  seq: number;
}

export interface Stored {
  v: 1;
  snapshot: Snapshot;
  /** Která relace naposledy dodala stav dané ukázky. */
  pathSession: Record<PathKey, string | null>;
  /** Relace v pořadí poslední aktivity, nejvýš MAX_SESSIONS. */
  sessions: Record<string, SessionInfo>;
  /** Čas relací, které už ze seznamu vypadly. */
  trimmedSeconds: number;
  lastSession: string;
  noteId: number | null;
  activityId: number | null;
}

export const STATUS_RANK: Record<Status, number> = { not_started: 0, in_progress: 1, skipped: 2, done: 3 };
const MAX_SESSIONS = 20;

/**
 * Vybere stav jedné ukázky ze dvou snímků. Vrací vždy jeden z objektů prev
 * nebo next (ne nový), podle toho merge() pozná, která relace vyhrála.
 * sameSession = next přišel ze stejné relace, která dodala prev.
 * rated = má daný stav ukázky hodnocení pro Pipedrive.
 */
export function mergePath<T extends { status: Status }>(prev: T, next: T, sameSession: boolean, rated: (p: T) => boolean = () => false): T {
  // V jedné relaci stav jen roste, novější snímek je vždy úplnější
  // (třeba druhá úprava aplikace po vyzvednutí odznaku).
  if (sameSession) return next;
  const a = STATUS_RANK[prev.status], b = STATUS_RANK[next.status];
  if (a !== b) return b > a ? next : prev;
  // Stejný stav z jiné relace. Na webu je novou relací každé obnovení stránky
  // a každé otevření odkazu z e-mailu, a ta často ukázku jen znovu otevře.
  // Starší snímek proto nese víc, ledaže hodnocení má teprve ten nový.
  // U hotové ukázky tím zůstává první dokončené hodnocení.
  return rated(next) && !rated(prev) ? next : prev;
}

/** Jen pole snímku, bez v, token, session a seq z payloadu. */
function pick(s: Snapshot): Snapshot {
  const { entry, entrySource, page, utm, fav, goal, firmInterest, lowIncome, paths, secondsTotal } = s;
  return { entry, entrySource, page, utm, fav, goal, firmInterest, lowIncome, paths, secondsTotal };
}

const hasUtm = (s: Snapshot) => Object.values(s.utm).some(Boolean);

export function merge(prev: Stored | null, incoming: Snapshot, session: string, seq: number): Stored {
  const next = pick(incoming);
  if (!prev) {
    const pathSession = Object.fromEntries(PATHS.map(k => [k, next.paths[k].status === 'not_started' ? null : session])) as Stored['pathSession'];
    return {
      v: 1, snapshot: next, pathSession, sessions: { [session]: { seconds: next.secondsTotal, seq } },
      trimmedSeconds: 0, lastSession: session, noteId: null, activityId: null,
    };
  }
  // opožděný starší snímek téže relace (debounce a sendBeacon se předběhly)
  const known = prev.sessions[session];
  if (known && seq <= known.seq) return prev;

  const old = prev.snapshot;
  const pathSession = { ...prev.pathSession };
  const paths = {} as Record<PathKey, PathSnaps[PathKey]>;
  for (const k of PATHS) {
    const rated = (p: PathSnaps[PathKey]) => rate(k, { ...old.paths, [k]: p }) !== null;
    const chosen = mergePath<PathSnaps[PathKey]>(old.paths[k], next.paths[k], prev.pathSession[k] === session, rated);
    paths[k] = chosen;
    if (chosen === next.paths[k]) pathSession[k] = session;
  }

  // relaci přesunout na konec, ať se ořezávají ty nejdéle neaktivní
  const sessions = { ...prev.sessions };
  delete sessions[session];
  sessions[session] = { seconds: Math.max(known?.seconds ?? 0, next.secondsTotal), seq };
  let trimmedSeconds = prev.trimmedSeconds;
  const ids = Object.keys(sessions);
  for (const id of ids.slice(0, Math.max(0, ids.length - MAX_SESSIONS))) {
    trimmedSeconds += sessions[id]!.seconds;
    delete sessions[id];
  }

  // Ve stejné relaci platí poslední stav odpovědí. Z jiné relace nepřepíše
  // nezaškrtnuté políčko zájem, který člověk dal najevo dřív.
  const same = prev.lastSession === session;
  const firmInterest = !same && old.firmInterest ? true : next.goal !== null ? next.firmInterest : old.firmInterest;
  const lowIncome = !same && old.lowIncome === true ? true : next.lowIncome ?? old.lowIncome;

  return {
    ...prev,
    pathSession,
    sessions,
    trimmedSeconds,
    lastSession: session,
    snapshot: {
      // odkud člověk přišel poprvé
      entry: old.entry,
      entrySource: old.entrySource,
      page: old.page,
      utm: hasUtm(old) ? old.utm : next.utm,
      fav: next.fav ?? old.fav,
      goal: next.goal ?? old.goal,
      firmInterest,
      lowIncome,
      paths: paths as unknown as PathSnaps,
      secondsTotal: trimmedSeconds + Object.values(sessions).reduce((a, b) => a + b.seconds, 0),
    },
  };
}
