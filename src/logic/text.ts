import { NBSP } from './typography.ts';

export const nf = (n: number) => Number(n).toLocaleString('cs-CZ');
export const kc = (n: number) => nf(n) + NBSP + 'Kč';

/** Doplní {klíč} v šabloně. Neznámý klíč nechá být, ať je chyba vidět. */
export function fill(tpl: string, vars: Record<string, string | number> = {}): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export interface PluralForms {
  one: string;
  few: string;
  many: string;
}
/** 1 úpravu, 2 až 4 úpravy, 0 a 5+ úprav */
export function plural(n: number, f: PluralForms): string {
  if (n === 1) return f.one;
  if (n >= 2 && n <= 4) return f.few;
  return f.many;
}
