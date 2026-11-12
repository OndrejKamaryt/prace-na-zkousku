/* Typografická pravidla z CLAUDE.md: pevná mezera za jednopísmennými slovy,
   mezi číslem a jednotkou a mezi skupinami tisíců. Bez importů, aby šel
   modul pustit i ze skriptu typo-fix.ts přímo v Node. */

export const NBSP = ' ';

// za k, s, v, z, o, u, a, i (i na začátku věty), když po nich něco následuje
const ONE_LETTER = /(?<=^|[\s („"'/])([ksvzouaiKSVZOUAI]) (?=\S)/gu;
// číslo nebo zástupný symbol {x} a za ním jednotka
const UNIT = /(?<=[\d}]) (?=(?:Kč|%|min|minut|minuty|minutu|s|h|kB)(?![\p{L}\d]))/gu;
// skupiny tisíců: 64 000, 1 840
const THOUSANDS = /(?<=\d) (?=\d{3}(?!\d))/gu;

export function fixTypography(text: string): string {
  return text
    .replace(ONE_LETTER, '$1' + NBSP)
    .replace(UNIT, NBSP)
    .replace(THOUSANDS, NBSP);
}

/** Projde libovolně zanořený JSON a vrátí cesty k textům, které pravidla porušují. */
export function findTypographyIssues(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return fixTypography(value) === value ? [] : [path];
  if (Array.isArray(value)) return value.flatMap((v, i) => findTypographyIssues(v, path + '[' + i + ']'));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => findTypographyIssues(v, path ? path + '.' + k : k));
  }
  return [];
}

/** Opraví všechny texty v JSON a vrátí novou kopii. */
export function fixTypographyDeep<T>(value: T): T {
  if (typeof value === 'string') return fixTypography(value) as T;
  if (Array.isArray(value)) return value.map(fixTypographyDeep) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fixTypographyDeep(v)])) as T;
  }
  return value;
}
