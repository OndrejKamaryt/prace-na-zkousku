import { describe, expect, it } from 'vitest';
import { commands } from '../../src/content/fixtures.ts';
import { ATTACKER, OFFICE, TRIES_START, TYPO, addTry, attempts, clock, newGame } from '../../src/logic/kyber.ts';
import { fixTypography, NBSP } from '../../src/logic/typography.ts';

describe('stav hry IT admina (Martinovo zadání UX-03, UX-11)', () => {
  it('pokusy útočníka přibývají až po startu a po spočítání stojí', () => {
    const g = newGame();
    addTry(g);
    expect(attempts(g)).toBe(TRIES_START);
    g.started = true;
    addTry(g);
    addTry(g);
    expect(attempts(g)).toBe(TRIES_START + 2);
    g.frozen = true;
    addTry(g);
    expect(attempts(g)).toBe(TRIES_START + 2);
    expect(g.byIp[OFFICE]).toBe(3);
    expect(g.byIp[TYPO]).toBe(1);
  });

  it('výpis uniq -c bere čísla ze stavu hry, takže sedí s přehledem i kartou adresy', () => {
    const g = newGame();
    g.byIp[ATTACKER] = 437;
    const text = commands(new Date(2026, 10, 12), g.byIp).count.out.map(([, html]) => html.replace(/<[^>]+>/g, ''));
    expect(text).toEqual(['  437  203.0.113.47', '    3  198.51.100.23', '    1  192.0.2.10']);
  });

  it('čas zásahu v minutách a sekundách', () => {
    expect([0, 38, 60, 125].map(clock)).toEqual(['0:00', '0:38', '1:00', '2:05']);
  });

  it('pevná mezera i před „minutu“', () => {
    expect(fixTypography('Pod 1 minutu')).toBe('Pod 1' + NBSP + 'minutu');
  });
});
