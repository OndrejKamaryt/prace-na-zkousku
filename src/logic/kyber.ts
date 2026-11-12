/* Jedna hra IT admina na jednom místě (Martinovo zadání UX-03 a kapitola 5):
   pokusy podle adresy, zabezpečení serveru, chyby, čas a z nich hvězdy.
   Přehled nahoře, karty adres i výpis terminálu se kreslí odsud, takže se
   čísla nerozejdou. Do stavu návštěvníka ani do Pipedrivu hra nejde, tam
   zapisuje obrazovka jen první dohrání (kyberAnswer, finish). */

/** Adresa útočníka a dvě nevinné adresy z výpisu. */
export const ATTACKER = '203.0.113.47';
export const OFFICE = '198.51.100.23';
export const TYPO = '192.0.2.10';

/** Pokusy útočníka ve chvíli, kdy správce zasáhne. Útok běží od 3:00. */
export const TRIES_START = 412;
/** Jak často útočník zkusí další heslo, v ms. */
export const TRY_MS = 140;
/** Hvězda za rychlost platí do 2 minut. */
export const FAST_SECONDS = 120;
/** Zabezpečení serveru v procentech po jednotlivých krocích. */
export const PCT = { start: 15, grep: 20, count: 25, found: 35, blocked: 50, locked: 70, f2b: 85, safe: 100 } as const;

export interface KyberGame {
  /** Neúspěšná přihlášení podle adresy. Útočníkovi přibývají, dokud je nespočítá příkaz. */
  byIp: Record<string, number>;
  /** Počítadlo stojí, terminál číslo vypsal. */
  frozen: boolean;
  /** Zabezpečení serveru v procentech. */
  pct: number;
  /** Čas zásahu v ms. Běží jen po „Začít zásah“ a při viditelné záložce. */
  ms: number;
  /** Špatné volby v krocích 1 až 3. */
  wrong: [number, number, number];
  started: boolean;
  finished: boolean;
}

export function newGame(): KyberGame {
  return {
    byIp: { [ATTACKER]: TRIES_START, [OFFICE]: 3, [TYPO]: 1 },
    frozen: false, pct: PCT.start, ms: 0, wrong: [0, 0, 0], started: false, finished: false,
  };
}

export const attempts = (g: KyberGame) => g.byIp[ATTACKER]!;
export const seconds = (g: KyberGame) => Math.floor(g.ms / 1000);
export const mistakes = (g: KyberGame) => g.wrong[0] + g.wrong[1] + g.wrong[2];

/** Útočník zkusil další heslo. Před startem, po spočítání a po konci se nic nemění. */
export function addTry(g: KyberGame): void {
  if (g.started && !g.frozen && !g.finished) g.byIp[ATTACKER]!++;
}

/** Hvězdy: za ubráněný server, za rozhodnutí napoprvé (pryč při první chybě) a za rychlost (pryč po 2 minutách). */
export function stars(g: KyberGame): number {
  return 3 - (mistakes(g) > 0 ? 1 : 0) - (seconds(g) > FAST_SECONDS ? 1 : 0);
}

/** Barva pruhu zabezpečení: pod 40 % červená, do 99 % žlutá, při 100 % zelená. */
export const meterLevel = (pct: number): 'low' | 'mid' | 'top' => (pct >= 100 ? 'top' : pct >= 40 ? 'mid' : 'low');

export const clock = (sec: number) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
