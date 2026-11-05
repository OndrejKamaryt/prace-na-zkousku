/* Payload pro POST /api/pnz: sestavení ve widgetu a přísná validace na serveru.
   Bez knihovny na schémata (zadání nepovoluje další závislosti). Přijímá jen
   známá pole, výčtové hodnoty a čísla v mezích. Volný text jde jen v page a utm. */
import { MAX_SECONDS, snapshot } from './state.ts';
import type { State } from './state.ts';
import { IDEAS, PATHS } from './types.ts';
import type { Payload, Utm } from './types.ts';

export const MAX_BODY_BYTES = 10 * 1024;
export const LIMITS = { count: 10_000, seconds: MAX_SECONDS, page: 300, utm: 200 } as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

/** Cesta stránky bez domény a query, jen znaky z URL. Jde do poznámky, takže žádné HTML. */
const PAGE = /^(\/[A-Za-z0-9/_.~%-]*)?$/;
/** UTM: cokoli kromě znaků, které by v CRM mohly dělat HTML, a řídicích znaků. */
const UTM_UNSAFE = /[<>"'`\u0000-\u001f\u007f]/g;

const cleanPage = (p: string) => (PAGE.test(p) ? p.slice(0, LIMITS.page) : '');
const cleanUtm = (u: Utm): Utm => {
  const c = (v: string) => v.replace(UTM_UNSAFE, '').slice(0, LIMITS.utm);
  return { source: c(u.source), medium: c(u.medium), campaign: c(u.campaign), content: c(u.content), term: c(u.term) };
};

/** Widget posílá vždy něco, co validací projde: dlouhé nebo podezřelé UTM a cestu ořízne. */
export function buildPayload(s: State, ctx: { token: string; session: string; seq: number; utm: Utm }, now: number): Payload {
  const snap = snapshot(s, now, cleanUtm(ctx.utm));
  return { v: 1, token: ctx.token.toLowerCase(), session: ctx.session, seq: ctx.seq, ...snap, page: cleanPage(snap.page) };
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

class Invalid extends Error {}
type Obj = Record<string, unknown>;

function obj(v: unknown, at: string, required: readonly string[], optional: readonly string[] = []): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Invalid(at + ': čekám objekt');
  const o = v as Obj;
  for (const k of required) if (!(k in o)) throw new Invalid(at + '.' + k + ': chybí');
  for (const k of Object.keys(o)) if (!required.includes(k) && !optional.includes(k)) throw new Invalid(at + '.' + k + ': neznámé pole');
  return o;
}
function oneOf<T>(v: unknown, at: string, allowed: readonly T[]): T {
  if (!allowed.includes(v as T)) throw new Invalid(at + ': nepovolená hodnota');
  return v as T;
}
function bool(v: unknown, at: string): boolean {
  if (typeof v !== 'boolean') throw new Invalid(at + ': čekám true nebo false');
  return v;
}
function int(v: unknown, at: string, max: number = LIMITS.count): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > max) throw new Invalid(at + ': čekám celé číslo 0 až ' + max);
  return v;
}
function str(v: unknown, at: string, max: number): string {
  if (typeof v !== 'string' || v.length > max) throw new Invalid(at + ': čekám text do ' + max + ' znaků');
  return v;
}
function page(v: unknown): string {
  const p = str(v, 'page', LIMITS.page);
  if (!PAGE.test(p)) throw new Invalid('page: čekám cestu stránky');
  return p;
}
function utmValue(v: unknown, at: string): string {
  const u = str(v, at, LIMITS.utm);
  if (new RegExp(UTM_UNSAFE.source).test(u)) throw new Invalid(at + ': nepovolené znaky');
  return u;
}

const STATUSES = ['not_started', 'in_progress', 'skipped', 'done'] as const;
const FAVS = [null, 'unknown', ...PATHS, ...PATHS.map(k => 'not:' + k)] as const;

function validate(input: unknown): Payload {
  const p = obj(input, 'payload', ['v', 'token', 'session', 'seq', 'entry', 'entrySource', 'page', 'utm', 'fav', 'goal', 'firmInterest', 'lowIncome', 'paths', 'secondsTotal']);
  oneOf(p.v, 'v', [1]);
  if (!isUuid(p.token)) throw new Invalid('token: čekám UUID v4');
  if (!isUuid(p.session)) throw new Invalid('session: čekám UUID v4');
  const utm = obj(p.utm, 'utm', ['source', 'medium', 'campaign', 'content', 'term']);
  const paths = obj(p.paths, 'paths', PATHS);
  const status = (o: Obj, at: string) => oneOf(o.status, at + '.status', STATUSES);
  const sec = (o: Obj, at: string) => int(o.seconds, at + '.seconds', LIMITS.seconds);

  const d = obj(paths.data, 'paths.data', ['status', 'seconds', 'mistakes', 'firstTry', 'revealed']);
  const a = obj(paths.ai, 'paths.ai', ['status', 'seconds', 'ideasTried', 'apps']);
  const apps = obj(a.apps, 'paths.ai.apps', [], IDEAS);
  const h = obj(paths.hry, 'paths.hry', ['status', 'seconds', 'plays', 'deaths', 'edits', 'ownPlays', 'defaultWon', 'ownWon', 'winAttempt', 'bestCoins']);
  const k = obj(paths.kyber, 'paths.kyber', ['status', 'seconds', 'firstOk', 'mistakes']);

  return {
    v: 1,
    token: p.token,
    session: p.session,
    seq: int(p.seq, 'seq', 1_000_000),
    entry: oneOf(p.entry, 'entry', ['start', ...PATHS] as const),
    entrySource: oneOf(p.entrySource, 'entrySource', ['url', 'attr', 'default'] as const),
    page: page(p.page),
    utm: {
      source: utmValue(utm.source, 'utm.source'),
      medium: utmValue(utm.medium, 'utm.medium'),
      campaign: utmValue(utm.campaign, 'utm.campaign'),
      content: utmValue(utm.content, 'utm.content'),
      term: utmValue(utm.term, 'utm.term'),
    },
    fav: oneOf(p.fav, 'fav', FAVS) as Payload['fav'],
    goal: oneOf(p.goal, 'goal', [null, 'switch', 'upskill'] as const),
    firmInterest: bool(p.firmInterest, 'firmInterest'),
    lowIncome: p.lowIncome === null ? null : bool(p.lowIncome, 'lowIncome'),
    paths: {
      data: {
        status: status(d, 'paths.data'), seconds: sec(d, 'paths.data'),
        // osm rozhodnutí, u každého nejvýš dvě špatné volby
        mistakes: int(d.mistakes, 'paths.data.mistakes', 16),
        firstTry: bool(d.firstTry, 'paths.data.firstTry'), revealed: bool(d.revealed, 'paths.data.revealed'),
      },
      ai: {
        status: status(a, 'paths.ai'), seconds: sec(a, 'paths.ai'), ideasTried: int(a.ideasTried, 'paths.ai.ideasTried'),
        apps: Object.fromEntries(Object.entries(apps).map(([idea, v]) => {
          const app = obj(v, 'paths.ai.apps.' + idea, ['built', 'changes']);
          return [idea, { built: bool(app.built, 'paths.ai.apps.' + idea + '.built'), changes: int(app.changes, 'paths.ai.apps.' + idea + '.changes', 3) }];
        })),
      },
      hry: {
        status: status(h, 'paths.hry'), seconds: sec(h, 'paths.hry'),
        plays: int(h.plays, 'paths.hry.plays'), deaths: int(h.deaths, 'paths.hry.deaths'), edits: int(h.edits, 'paths.hry.edits'),
        ownPlays: int(h.ownPlays, 'paths.hry.ownPlays'), defaultWon: bool(h.defaultWon, 'paths.hry.defaultWon'),
        ownWon: bool(h.ownWon, 'paths.hry.ownWon'), winAttempt: int(h.winAttempt, 'paths.hry.winAttempt'),
        bestCoins: int(h.bestCoins, 'paths.hry.bestCoins', 84),
      },
      kyber: {
        status: status(k, 'paths.kyber'), seconds: sec(k, 'paths.kyber'),
        firstOk: int(k.firstOk, 'paths.kyber.firstOk', 3), mistakes: int(k.mistakes, 'paths.kyber.mistakes'),
      },
    },
    secondsTotal: int(p.secondsTotal, 'secondsTotal', LIMITS.seconds),
  };
}

export function parsePayload(input: unknown): Parsed<Payload> {
  try {
    return { ok: true, value: validate(input) };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: e.message };
    throw e;
  }
}

/** Tělo požadavku jako text: application/json i text/plain ze sendBeacon. */
export function parseBody(body: string): Parsed<Payload> {
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) return { ok: false, error: 'tělo je větší než 10 kB' };
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return { ok: false, error: 'tělo není JSON' };
  }
  if (data && typeof data === 'object' && typeof (data as Obj).token === 'string') {
    (data as Obj).token = ((data as Obj).token as string).toLowerCase();
  }
  return parsePayload(data);
}
