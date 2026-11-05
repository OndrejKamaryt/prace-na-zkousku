/* Stav návštěvníka ve widgetu. Obrazovky volají tyto funkce, nic víc stav
   nemění. Funkce stav mění na místě, stejně jako prototyp mění objekt S.
   Čas se předává zvenku (now v ms), aby šly funkce testovat. */
import { IDEAS } from './types.ts';
import type {
  AiSnap, DataSnap, EntrySource, Fav, Goal, HrySnap, IdeaKey, KyberSnap, PathKey, Screen, Snapshot, Status, Utm,
} from './types.ts';

interface Timing {
  t0: number;
  t1: number;
}
type DataState = Omit<DataSnap, 'seconds'> & Timing & { stepWrong: number };
type AiState = Omit<AiSnap, 'seconds' | 'apps'> & Timing & { apps: Partial<Record<IdeaKey, { built: boolean; changes: string[] }>> };
type HryState = Omit<HrySnap, 'seconds'> & Timing;
type KyberState = Omit<KyberSnap, 'seconds'> & Timing;

export interface State {
  entry: Screen;
  entrySource: EntrySource;
  page: string;
  firstAt: number;
  fav: Fav;
  goal: Goal;
  firm: boolean;
  lowIncome: boolean | null;
  data: DataState;
  ai: AiState;
  hry: HryState;
  kyber: KyberState;
}

/** Po kolika špatných odpovědích v jednom kroku ukáže Datová analýza správnou. */
export const DATA_MAX_WRONG = 2;

const timing = (): Timing => ({ t0: 0, t1: 0 });
const NOT_STARTED: Status = 'not_started';

export function createState(entry: Screen = 'start', entrySource: EntrySource = 'default', page = ''): State {
  return {
    entry, entrySource, page, firstAt: 0,
    fav: null, goal: null, firm: false, lowIncome: null,
    data: { status: NOT_STARTED, ...timing(), mistakes: 0, stepWrong: 0, firstTry: false, revealed: false },
    ai: { status: NOT_STARTED, ...timing(), ideasTried: 0, apps: {} },
    hry: { status: NOT_STARTED, ...timing(), plays: 0, deaths: 0, edits: 0, ownPlays: 0, defaultWon: false, ownWon: false, winAttempt: 0, bestCoins: 0 },
    kyber: { status: NOT_STARTED, ...timing(), firstOk: 0, mistakes: 0 },
  };
}

/** Návštěvník ukázku otevřel: začne běžet čas, stav se nemění (jako startTimer() v prototypu). */
export function openPath(s: State, k: PathKey, now: number): void {
  const p = s[k];
  if (!p.t0) p.t0 = now;
  if (!s.firstAt) s.firstAt = now;
}

/** První akce v ukázce: z nezačaté se stane rozpracovaná. */
export function touch(s: State, k: PathKey, now: number): void {
  openPath(s, k, now);
  if (s[k].status === NOT_STARTED) s[k].status = 'in_progress';
}

/** Ukázka je hotová. Vrací true jen poprvé. */
export function finish(s: State, k: PathKey, now: number): boolean {
  touch(s, k, now);
  const p = s[k];
  if (p.status === 'done') return false;
  p.status = 'done';
  p.t1 = now;
  return true;
}

/* ---------- Datová analýza ---------- */
export type DataOutcome = 'wrong' | 'solved' | 'revealed' | 'ignored';
export function answerData(s: State, correct: boolean, now: number): DataOutcome {
  const d = s.data;
  if (d.status === 'done') return 'ignored';
  touch(s, 'data', now);
  if (correct) {
    d.stepWrong = 0;
    return 'solved';
  }
  d.mistakes++;
  if (++d.stepWrong < DATA_MAX_WRONG) return 'wrong';
  d.stepWrong = 0;
  d.revealed = true;
  return 'revealed';
}
/** Poslední krok je za námi. Vrací true jen poprvé. */
export function finishData(s: State, now: number): boolean {
  s.data.firstTry = s.data.mistakes === 0;
  return finish(s, 'data', now);
}

/* ---------- Stavění s AI ---------- */
export function startIdea(s: State, idea: IdeaKey, now: number): void {
  touch(s, 'ai', now);
  s.ai.ideasTried++;
  s.ai.apps[idea] ??= { built: false, changes: [] };
}
export function ideaBuilt(s: State, idea: IdeaKey): void {
  const app = s.ai.apps[idea];
  if (app) app.built = true;
}
/** Volat až po provedení úpravy. Stejná úprava téže aplikace se počítá jednou. Vrací true poprvé, kdy je ukázka hotová. */
export function changeApplied(s: State, idea: IdeaKey, changeId: string, now: number): boolean {
  const app = s.ai.apps[idea];
  if (!app || !app.built) return false;
  if (!app.changes.includes(changeId)) app.changes.push(changeId);
  return finish(s, 'ai', now);
}

/* ---------- Tvorba her ---------- */
/** own = hraje se upravený level (fáze 2 a víc, aspoň jeden upravený dílek) */
export function gamePlay(s: State, own: boolean, now: number): void {
  touch(s, 'hry', now);
  s.hry.plays++;
  if (own) s.hry.ownPlays++;
}
export function gameDeath(s: State): void {
  s.hry.deaths++;
}
export function gameEdit(s: State, now: number): void {
  touch(s, 'hry', now);
  s.hry.edits++;
}
/** Vrací true, když dohrání vlastní verze ukázku poprvé dokončilo. */
export function gameWin(s: State, own: boolean, coins: number, now: number): boolean {
  const h = s.hry;
  h.bestCoins = Math.max(h.bestCoins, coins);
  if (!own) {
    h.defaultWon = true;
    return false;
  }
  h.ownWon = true;
  if (!h.winAttempt) h.winAttempt = Math.max(1, h.ownPlays);
  return finish(s, 'hry', now);
}
/** „Stačí, chci výsledek“: ukázka není hotová, ale přeskočená. */
export function gameSkip(s: State, now: number): void {
  touch(s, 'hry', now);
  if (s.hry.status === 'done') return;
  s.hry.status = 'skipped';
  s.hry.t1 = now;
}

/* ---------- Kyberbezpečnost ---------- */
export function kyberAnswer(s: State, correct: boolean, firstTry: boolean, now: number): void {
  touch(s, 'kyber', now);
  if (!correct) s.kyber.mistakes++;
  else if (firstTry) s.kyber.firstOk++;
}

/* ---------- Odpovědi ve výsledku ---------- */
export function setFav(s: State, fav: Fav): void {
  s.fav = fav;
}
export function setGoal(s: State, goal: Goal): void {
  s.goal = goal;
}
export function setFirm(s: State, firm: boolean): void {
  s.firm = firm;
}
/** Volá výsledek, když zaškrtávátko poprvé ukáže; do té doby zůstává null. */
export function lowIncomeShown(s: State): void {
  s.lowIncome ??= false;
}
export function setLowIncome(s: State, value: boolean): void {
  s.lowIncome = value;
}

/* ---------- Snímek pro výsledek, analytiku a endpoint ---------- */
/** Celé sekundy dolů, aby minuty ve why() vyšly stejně jako mins() v prototypu. Strop drží payload v mezích validace. */
export const MAX_SECONDS = 7 * 24 * 3600;
const toSecs = (ms: number) => Math.min(MAX_SECONDS, Math.max(0, Math.floor(ms / 1000)));
const secs = (t: Timing, now: number) => (t.t0 ? toSecs((t.t1 || now) - t.t0) : 0);

const EMPTY_UTM: Utm = { source: '', medium: '', campaign: '', content: '', term: '' };

export function snapshot(s: State, now: number, utm: Utm = EMPTY_UTM): Snapshot {
  const { t0: _d0, t1: _d1, stepWrong: _dw, ...data } = s.data;
  const { t0: _a0, t1: _a1, apps, ...ai } = s.ai;
  const { t0: _h0, t1: _h1, ...hry } = s.hry;
  const { t0: _k0, t1: _k1, ...kyber } = s.kyber;
  const aiApps: AiSnap['apps'] = {};
  for (const idea of IDEAS) {
    const a = apps[idea];
    if (a) aiApps[idea] = { built: a.built, changes: a.changes.length };
  }
  return {
    entry: s.entry,
    entrySource: s.entrySource,
    page: s.page,
    utm: { ...utm },
    fav: s.fav,
    goal: s.goal,
    firmInterest: s.firm && s.goal === 'upskill',
    lowIncome: s.lowIncome,
    paths: {
      data: { ...data, seconds: secs(s.data, now) },
      ai: { ...ai, seconds: secs(s.ai, now), apps: aiApps },
      hry: { ...hry, seconds: secs(s.hry, now) },
      kyber: { ...kyber, seconds: secs(s.kyber, now) },
    },
    secondsTotal: s.firstAt ? toSecs(now - s.firstAt) : 0,
  };
}
