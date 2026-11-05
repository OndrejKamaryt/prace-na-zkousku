/* Čísla a volby datové ukázky musí držet pohromadě: hráč je vidí v několika grafech naráz. */
import { describe, expect, it } from 'vitest';
import cs from '../../src/content/cs.json';
import { NBSP } from '../../src/logic/typography.ts';

interface Bar { label: string; a: number; b?: number; why?: string }
interface Step { q: string; chart?: string; right?: number[]; rows?: Bar[]; options?: { t: string; ok?: boolean; why?: string }[] }

const steps = cs.data.steps as unknown as Step[];
const chart = (name: string) => steps.find(s => s.chart === name)!;
const sum = (rows: Bar[], key: 'a' | 'b') => rows.reduce((n, r) => n + (r[key] ?? 0), 0);
const money = (n: number) => n.toLocaleString('cs-CZ').replaceAll(' ', NBSP) + NBSP + 'Kč';

describe('datová ukázka: čísla', () => {
  const [, feb, mar] = chart('months').rows!;
  const days = chart('days'), products = chart('products');

  it('dny i produkty dávají dohromady stejné tržby jako měsíce', () => {
    for (const rows of [days.rows!, products.rows!]) {
      expect(sum(rows, 'a')).toBe(feb!.a);
      expect(sum(rows, 'b')).toBe(mar!.a);
    }
  });
  it('rozdíly v textech odpovídají datům', () => {
    const fall = (r: Bar) => r.a - (r.b ?? 0);
    expect(chart('months').rows![1]!.a - chart('months').rows![2]!.a).toBe(57600);
    expect(days.right!.reduce((n, i) => n + fall(days.rows![i]!), 0)).toBe(55500);
    expect(fall(products.rows![products.right![0]!]!)).toBe(cs.data.lost);
    expect(JSON.stringify(cs.data)).toContain(money(57600));
    expect(JSON.stringify(cs.data)).toContain(money(55500));
    expect(JSON.stringify(cs.data)).toContain(money(cs.data.lost));
  });
});

describe('datová ukázka: rozhodnutí', () => {
  it('je jich osm, takže chyb může být nejvýš šestnáct, jak čeká validace', () => {
    expect(steps).toHaveLength(8);
  });
  it('každá volba má jednu správnou odpověď a špatné mají vysvětlení', () => {
    for (const s of steps.filter(x => x.options)) {
      expect(s.options!.filter(o => o.ok), s.q).toHaveLength(1);
      for (const o of s.options!) expect(!!o.ok !== !!o.why, o.t).toBe(true);
    }
  });
  it('každý špatný sloupec má vysvětlení a správný ne', () => {
    for (const s of steps.filter(x => x.chart)) {
      s.rows!.forEach((r, i) => expect(s.right!.includes(i) !== !!r.why, r.label).toBe(true));
    }
  });
});
