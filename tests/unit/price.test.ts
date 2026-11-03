import { describe, expect, it } from 'vitest';
import { lowIncomeMatters, priceFor } from '../../src/logic/price.ts';
import { kc } from '../../src/logic/text.ts';

describe('priceFor podle tabulky v ZADANI kap. 6', () => {
  it.each([
    ['data', 64000, 29000, 35000],
    ['ai', 24900, 5795, 19105],
    ['hry', 49000, 14000, 35000],
    ['kyber', 54000, 19000, 35000],
  ] as const)('%s', (k, price, pay, contrib) => {
    expect(priceFor(k, false)).toEqual({ price, pay, contrib, digikurzy: true });
  });

  it('nízkopříjmová skupina: celá cena, nejvýš strop', () => {
    expect(priceFor('ai', true)).toMatchObject({ contrib: 24900, pay: 0 });
    expect(priceFor('data', true)).toMatchObject({ contrib: 35000, pay: 29000 });
  });

  it('kurz bez DIGIkurzů nemá příspěvek', () => {
    const course = { price: 24900, digikurzy: false, url: '', next: 'webinar' };
    expect(priceFor('ai', false, undefined, course)).toEqual({ price: 24900, contrib: 0, pay: 24900, digikurzy: false });
  });
});

describe('lowIncomeMatters počítá hranici z konfigurace', () => {
  it('ukazuje zaškrtávátko jen u Claude Code', () => {
    expect([lowIncomeMatters('data'), lowIncomeMatters('ai'), lowIncomeMatters('hry'), lowIncomeMatters('kyber')])
      .toEqual([false, true, false, false]);
  });
  it('hranice vychází 45 615 Kč jako v prototypu', () => {
    const at = (price: number) => lowIncomeMatters('ai', undefined, { price, digikurzy: true, url: '', next: 'webinar' });
    expect(at(45614)).toBe(true);
    expect(at(45615)).toBe(false);
  });
  it('posune se se změnou stropu', () => {
    expect(lowIncomeMatters('hry', { rate: 0.7673, cap: 40000 })).toBe(true);
  });
});

describe('kc', () => {
  it('odděluje tisíce i jednotku pevnou mezerou', () => {
    expect(kc(64000)).toBe('64 000 Kč');
    expect(kc(5795)).toBe('5 795 Kč');
  });
});
