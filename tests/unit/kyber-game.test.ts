import { describe, expect, it } from 'vitest';
import { commands } from '../../src/content/fixtures.ts';
import { ATTACKER, FAST_SECONDS, OFFICE, TRIES_START, TYPO, addTry, attempts, clock, meterLevel, newGame, stars } from '../../src/logic/kyber.ts';
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

  it('hvězda za rozhodnutí zmizí při první chybě, hvězda za rychlost po 2 minutách', () => {
    const g = newGame();
    expect(stars(g)).toBe(3);
    g.ms = FAST_SECONDS * 1000;
    expect(stars(g)).toBe(3);
    g.ms += 1000;
    expect(stars(g)).toBe(2);
    g.wrong[1] = 1;
    expect(stars(g)).toBe(1);
    g.wrong[2] = 4;
    expect(stars(g)).toBe(1);
  });

  it('pruh zabezpečení: pod 40 % červený, do 99 % žlutý, při 100 % zelený', () => {
    expect([15, 39, 40, 99, 100].map(meterLevel)).toEqual(['low', 'low', 'mid', 'mid', 'top']);
  });

  it('čas zásahu v minutách a sekundách', () => {
    expect([0, 38, 60, 125].map(clock)).toEqual(['0:00', '0:38', '1:00', '2:05']);
  });

  it('pevná mezera i před „minutu“', () => {
    expect(fixTypography('Pod 1 minutu')).toBe('Pod 1' + NBSP + 'minutu');
  });
});
