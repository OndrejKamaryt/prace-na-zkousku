import { describe, expect, it } from 'vitest';
import { recommend, why } from '../../src/logic/recommend.ts';
import { noteRows, noteText, opener } from '../../src/logic/sales.ts';
import {
  answerData, changeApplied, finish, gameDeath, gameEdit, gamePlay, gameSkip, gameWin, ideaBuilt, kyberAnswer,
  setFav, setFirm, setGoal, startIdea, viewData,
} from '../../src/logic/state.ts';
import type { State } from '../../src/logic/state.ts';
import { min, snap, typo } from './helpers.ts';

const now = min(1);
const dataFirstTry = (s: State) => answerData(s, true, now);
const dataSecondTry = (s: State) => { answerData(s, false, now); answerData(s, true, now); };
const aiWith = (n: number) => (s: State) => {
  startIdea(s, 'kadernice', now); ideaBuilt(s, 'kadernice');
  ['service', 'busy', 'dark'].slice(0, n).forEach(c => changeApplied(s, 'kadernice', c, now));
};
const kyberDone = (ok: number) => (s: State) => {
  for (let i = 0; i < 3; i++) kyberAnswer(s, true, i < ok, now);
  finish(s, 'kyber', now);
};

describe('opener (věta do telefonu)', () => {
  it('odpovídá příkladu v ZADANI kap. 4', () => {
    expect(opener(snap(dataFirstTry))).toBe(typo('Vidím, že máte za sebou datovou detektivku, a to hned napoprvé. Co vás na práci s daty bavilo?'));
  });
  it('data bez prvního pokusu', () => {
    expect(opener(snap(dataSecondTry))).toBe(typo('Vidím, že máte za sebou datovou detektivku. Co vás na práci s daty bavilo?'));
  });
  it.each([
    [1, 'Vidím, že vám AI agent postavil aplikaci „Rezervační systém“ a dostal od vás 1 úpravu. Máte nápad, co by se vám hodilo postavit pro sebe nebo do práce?'],
    [2, 'Vidím, že vám AI agent postavil aplikaci „Rezervační systém“ a dostal od vás 2 úpravy. Máte nápad, co by se vám hodilo postavit pro sebe nebo do práce?'],
  ])('AI s %i úpravami', (n, text) => {
    expect(opener(snap(aiWith(n)))).toBe(typo(text));
  });
  it('AI mluví o aplikaci s nejvíc úpravami, ne o poslední', () => {
    const o = opener(snap(s => {
      aiWith(2)(s);
      startIdea(s, 'uctenka', now); ideaBuilt(s, 'uctenka'); changeApplied(s, 'uctenka', 'tip', now);
    }));
    expect(o).toContain('Rezervační systém');
  });
  it('hra s dohraným vlastním levelem', () => {
    const o = opener(snap(s => { gameEdit(s, now); gamePlay(s, true, now); gameWin(s, true, 2, now); }));
    expect(o).toBe(typo('Vidím, že máte postavený vlastní level a dokonce dohraný. Které hry hrajete nejraději?'));
  });
  it('přeskočená hra netvrdí, že je level postavený', () => {
    const o = opener(snap(s => { for (let i = 0; i < 6; i++) { gamePlay(s, false, now); gameDeath(s); } gameSkip(s, now); }));
    expect(o).toBe(typo('Vidím, že ukázku s tvorbou her máte rozehranou. Které hry hrajete nejraději?'));
  });
  it.each([[3, ' bez jediné chyby'], [2, '']])('kyber s %i správnými napoprvé', (ok, clean) => {
    expect(opener(snap(kyberDone(ok)))).toBe(typo('Vidím, že máte za sebou noční poplach na serveru' + clean + '. Co vás na kyberbezpečnosti láká?'));
  });
  it('bez hotové ukázky řekne neutrálně, že nic nedokončil', () => {
    expect(opener(snap(s => viewData(s, 'dny', now)))).toBe('Zatím nic nedokončeno.');
  });
  it('„Spíš ne“ platí jen pro ukázku, u které padlo', () => {
    const one = snap(s => { dataFirstTry(s); setFav(s, 'not:data'); });
    expect(opener(one)).toBe(typo('Vidím, že vás ukázka „Datová analýza“ moc nechytla. Co by vás lákalo víc?'));
    const two = snap(s => { dataFirstTry(s); setFav(s, 'not:data'); aiWith(2)(s); }, min(10), ['ai', 'url']);
    expect(recommend(two)).toBe('ai');
    expect(opener(two)).not.toContain('nechytla');
  });
});

describe('recommend', () => {
  it('upřednostní, co bavilo nejvíc', () => {
    const s = snap(s => { dataFirstTry(s); kyberDone(3)(s); setFav(s, 'kyber'); });
    expect(recommend(s)).toBe('kyber');
  });
  it('přičte bonus za vstupní ukázku', () => {
    const s = snap(s => { dataFirstTry(s); aiWith(1)(s); }, min(10), ['ai', 'url']);
    expect(recommend(s)).toBe('ai');
  });
  it('přeskočená hra se doporučí jen bez hotové ukázky', () => {
    const skip = (s: State) => { gamePlay(s, false, now); gameSkip(s, now); };
    expect(recommend(snap(skip))).toBe('hry');
    expect(recommend(snap(s => { skip(s); dataSecondTry(s); }, min(10), ['hry', 'url']))).toBe('data');
  });
});

describe('why', () => {
  it('odlišuje odhalenou odpověď od třetího pokusu', () => {
    const third = snap(s => { answerData(s, false, now); answerData(s, false, now); answerData(s, true, min(3)); });
    const shown = snap(s => { for (let i = 0; i < 3; i++) answerData(s, false, now); });
    expect(why('data', third)[0]).toBe('Detektivka vyřešená na 3. pokus');
    expect(why('data', shown)[0]).toBe('Správnou odpověď ukázal nástroj');
    expect(why('data', third)[2]).toBe('Čas: 2 min');
  });
});

describe('poznámka pro obchod', () => {
  it('školení přes firmu je výrazně nahoře a jen u cíle zlepšit se', () => {
    const s = snap(s => { dataFirstTry(s); setGoal(s, 'upskill'); setFirm(s, true); });
    expect(noteText(s).split('\n')[0]).toBe(typo('ZÁJEM O ŠKOLENÍ PŘES FIRMU, PŘEDAT LIFESCALE BUSINESS'));
    const switched = snap(s => { dataFirstTry(s); setGoal(s, 'upskill'); setFirm(s, true); setGoal(s, 'switch'); });
    expect(noteText(switched)).not.toContain('LIFESCALE');
  });
  it('popisuje vstup podle zdroje a stránky', () => {
    const rows = noteRows(snap(dataFirstTry, min(10), ['data', 'attr', '/cz/kurzy/data-analyst']));
    expect(rows[0]).toEqual({ label: 'Vstup', values: [typo('stránka kurzu, ukázka Datová analýza')] });
    expect(rows[1]).toEqual({ label: 'Stránka', values: ['/cz/kurzy/data-analyst'] });
    const ad = noteRows(snap(dataFirstTry, min(10), ['data', 'url']));
    expect(ad[0]!.values).toEqual([typo('odkaz na ukázku Datová analýza')]);
  });
  it('nepoložená otázka na nízký příjem není „ne“', () => {
    const rows = noteRows(snap(dataFirstTry));
    expect(rows.find(r => r.label === typo('Nízkopříjmová skupina'))!.values).toEqual(['otázka se nezobrazila']);
  });
});
