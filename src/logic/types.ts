/* Sdílené typy widgetu a endpointu. Snapshot je to, co widget posílá
   a co endpoint ukládá; hodnocení, doporučení a texty pro obchod se z něj
   odvozují na obou stranách stejným kódem. */

export const PATHS = ['data', 'ai', 'hry', 'kyber'] as const;
export type PathKey = (typeof PATHS)[number];

export const IDEAS = ['uctenka', 'kadernice', 'navyky'] as const;
export type IdeaKey = (typeof IDEAS)[number];

export type Status = 'not_started' | 'in_progress' | 'skipped' | 'done';
export type Rating = 'bad' | 'average' | 'great';

/** null = bez odpovědi, 'unknown' = Nevím, klíč = bavilo nejvíc, 'not:klíč' = Spíš ne u dané ukázky */
export type Fav = null | 'unknown' | PathKey | `not:${PathKey}`;
export type Goal = null | 'switch' | 'upskill';

export type Screen = 'start' | PathKey;
/** url = ?ukazka, attr = data-start, default = nic z toho */
export type EntrySource = 'url' | 'attr' | 'default';

export interface Utm {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
}

export interface DataSnap {
  status: Status;
  seconds: number;
  viewsSeen: number;
  tries: number;
  firstTry: boolean;
  revealed: boolean;
}
export interface AiApp {
  built: boolean;
  changes: number;
}
export interface AiSnap {
  status: Status;
  seconds: number;
  ideasTried: number;
  apps: Partial<Record<IdeaKey, AiApp>>;
}
export interface HrySnap {
  status: Status;
  seconds: number;
  plays: number;
  deaths: number;
  edits: number;
  ownPlays: number;
  defaultWon: boolean;
  ownWon: boolean;
  winAttempt: number;
  bestCoins: number;
}
export interface KyberSnap {
  status: Status;
  seconds: number;
  firstOk: number;
  mistakes: number;
}
export interface PathSnaps {
  data: DataSnap;
  ai: AiSnap;
  hry: HrySnap;
  kyber: KyberSnap;
}

export interface Snapshot {
  entry: Screen;
  entrySource: EntrySource;
  page: string;
  utm: Utm;
  fav: Fav;
  goal: Goal;
  firmInterest: boolean;
  /** null = otázka se nezobrazila */
  lowIncome: boolean | null;
  paths: PathSnaps;
  secondsTotal: number;
}

export interface Payload extends Snapshot {
  v: 1;
  token: string;
  session: string;
  /** Pořadí odeslání v relaci. Server zahodí snímek, který dorazí po novějším (debounce a sendBeacon se můžou předběhnout). */
  seq: number;
}
