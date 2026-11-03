import { describe, expect, it } from 'vitest';
import cs from '../../src/content/cs.json';
import { findTypographyIssues, fixTypography, NBSP } from '../../src/logic/typography.ts';

const show = (s: string) => s.replaceAll(NBSP, '~');

describe('fixTypography', () => {
  it('dá pevnou mezeru za jednopísmenná slova, i za sebou', () => {
    expect(show(fixTypography('Je to v práci a v kanceláři.'))).toBe('Je to v~práci a~v~kanceláři.');
    expect(show(fixTypography('S přihláškou ti pomůžeme.'))).toBe('S~přihláškou ti pomůžeme.');
    expect(show(fixTypography('„a tak dál“ (v sobotu)'))).toBe('„a~tak dál“ (v~sobotu)');
  });
  it('nechá být písmena uvnitř slov a na konci textu', () => {
    expect(fixTypography('Kurz je pro tebe a')).toBe('Kurz je pro tebe a');
    expect(fixTypography('Tabulka, data')).toBe('Tabulka, data');
  });
  it('spojí číslo s jednotkou a skupiny tisíců', () => {
    expect(show(fixTypography('Cena 64 000 Kč, příspěvek 76,73 %, 5 minut'))).toBe('Cena 64~000~Kč, příspěvek 76,73~%, 5~minut');
    expect(show(fixTypography('Čas: {min} min'))).toBe('Čas: {min}~min');
    expect(show(fixTypography('Unreal Engine 5 stolů'))).toBe('Unreal Engine 5 stolů');
  });
  it('je idempotentní', () => {
    const once = fixTypography('Z toho 35 000 Kč zaplatí úřad práce a v 13:00 začne kurz.');
    expect(fixTypography(once)).toBe(once);
  });
});

describe('cs.json', () => {
  it('dodržuje typografii z CLAUDE.md (oprava: npm run typo:fix)', () => {
    expect(findTypographyIssues(cs)).toEqual([]);
  });
  it('nemá dlouhou pomlčku ani tečku jako oddělovač', () => {
    const text = JSON.stringify(cs);
    expect(text).not.toContain('—');
    expect(text).not.toMatch(/\s[·•]\s/);
  });
  it('má neutrální názvy odznaků', () => {
    expect([cs.paths.data.badge, cs.paths.ai.badge, cs.paths.hry.badge, cs.paths.kyber.badge])
      .toEqual(['Detektivka vyřešená', 'Aplikace postavená', 'Level dohraný', 'Server ubráněný']);
  });
});
