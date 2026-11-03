import { describe, expect, it } from 'vitest';
import { merge, mergePath } from '../../src/logic/merge.ts';
import { rate } from '../../src/logic/rating.ts';
import {
  answerData, gamePlay, gameWin, ideaBuilt, lowIncomeShown, setFav, setFirm, setGoal, setLowIncome, startIdea,
} from '../../src/logic/state.ts';
import type { State } from '../../src/logic/state.ts';
import type { DataSnap } from '../../src/logic/types.ts';
import { min, snap } from './helpers.ts';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const now = min(1);
const wrongThenRight = (s: State) => { answerData(s, false, now); answerData(s, true, now); };
const firstTry = (s: State) => answerData(s, true, now);

const data = (status: DataSnap['status'], tries = 0): DataSnap =>
  ({ status, seconds: 60, viewsSeen: 1, tries, firstTry: tries === 1, revealed: false });

describe('mergePath: odsouhlasená pravidla (PLAN.md, rozhodnutí 8)', () => {
  it('ve stejné relaci vyhrává novější snímek', () => {
    const prev = data('done', 1), next = { ...data('done', 1), seconds: 90 };
    expect(mergePath(prev, next, true)).toBe(next);
  });
  it('hotová ukázka z dřívější relace se už nemění', () => {
    const prev = data('done', 2), next = data('done', 1);
    expect(mergePath(prev, next, false)).toBe(prev);
  });
  it('z jiné relace stav nikdy neklesne', () => {
    const prev = data('done', 1);
    expect(mergePath(prev, data('not_started'), false)).toBe(prev);
    expect(mergePath(prev, data('in_progress'), false)).toBe(prev);
    const started = data('in_progress');
    expect(mergePath(started, data('not_started'), false)).toBe(started);
  });
  it('vyšší stav z nové relace vyhraje', () => {
    const prev = data('in_progress'), next = data('done', 1);
    expect(mergePath(prev, next, false)).toBe(next);
  });
});

describe('mergePath: shoda stavů z různých relací (obnovení stránky na webu)', () => {
  it('nechá starší snímek, když nový jen znovu otevřel ukázku', () => {
    const built = merge(null, snap(s => { startIdea(s, 'uctenka', now); ideaBuilt(s, 'uctenka'); }), A, 1);
    const reopened = merge(built, snap(s => startIdea(s, 'navyky', now)), B, 1);
    expect(rate('ai', reopened.snapshot.paths)).toBe('bad');
    expect(reopened.pathSession.ai).toBe(A);
  });
  it('vezme nový snímek, když hodnocení má teprve on', () => {
    const started = merge(null, snap(s => gamePlay(s, false, now)), A, 1);
    const won = merge(started, snap(s => { gamePlay(s, false, now); gameWin(s, false, 2, now); }), B, 1);
    expect(rate('hry', won.snapshot.paths)).toBe('average');
    expect(won.pathSession.hry).toBe(B);
  });
});

describe('merge', () => {
  it('druhá návštěva nesmaže hodnocení z první', () => {
    const first = merge(null, snap(firstTry), A, 1);
    const second = merge(first, snap(() => {}), B, 2);
    expect(rate('data', second.snapshot.paths)).toBe('great');
  });
  it('opakovaná detektivka v nové relaci hodnocení nezlepší', () => {
    const first = merge(null, snap(wrongThenRight), A, 3);
    const again = merge(first, snap(firstTry), B, 4);
    expect(rate('data', again.snapshot.paths)).toBe('average');
  });
  it('u odpovědí platí poslední daná, nepoložená nic nepřepíše', () => {
    const first = merge(null, snap(s => { firstTry(s); setGoal(s, 'upskill'); setFav(s, 'data'); }), A, 1);
    const second = merge(first, snap(s => setGoal(s, 'switch')), B, 5);
    expect(second.snapshot.goal).toBe('switch');
    expect(second.snapshot.fav).toBe('data');
  });
  it('sčítá čas po relacích a nepočítá opakované snímky jedné relace dvakrát', () => {
    let st = merge(null, snap(firstTry, min(5)), A, 6);
    st = merge(st, snap(firstTry, min(8)), A, 7);
    st = merge(st, snap(firstTry, min(3)), B, 8);
    expect(st.snapshot.secondsTotal).toBe((8 - 1) * 60 + (3 - 1) * 60);
  });
  it('drží první vstup a UTM', () => {
    const first = merge(null, snap(firstTry, min(5), ['data', 'url', '/a']), A, 9);
    const second = merge(first, snap(firstTry, min(5), ['kyber', 'attr', '/b']), B, 10);
    expect([second.snapshot.entry, second.snapshot.page]).toEqual(['data', '/a']);
  });
  it('zahodí starší snímek téže relace, který dorazil pozdě', () => {
    const newer = merge(null, snap(s => { firstTry(s); setGoal(s, 'upskill'); }, min(10)), A, 2);
    expect(merge(newer, snap(() => {}, min(3)), A, 1)).toBe(newer);
  });
  it('nezaškrtnuté políčko z další návštěvy nesmaže dřívější zájem', () => {
    const first = merge(null, snap(s => { firstTry(s); setGoal(s, 'upskill'); setFirm(s, true); lowIncomeShown(s); setLowIncome(s, true); }), A, 1);
    const second = merge(first, snap(s => { firstTry(s); setGoal(s, 'upskill'); lowIncomeShown(s); }), B, 1);
    expect([second.snapshot.firmInterest, second.snapshot.lowIncome]).toEqual([true, true]);
    const sameSession = merge(first, snap(s => { firstTry(s); setGoal(s, 'upskill'); lowIncomeShown(s); }), A, 2);
    expect([sameSession.snapshot.firmInterest, sameSession.snapshot.lowIncome]).toEqual([false, false]);
  });
  it('ukládá jen pole snímku, ne token a relaci z payloadu', () => {
    const p = { ...snap(firstTry), v: 1, token: 'x', session: A, seq: 1 };
    expect(Object.keys(merge(null, p, A, 1).snapshot)).not.toContain('token');
  });
  it('po ořezu starých relací čas nezmizí', () => {
    let st = merge(null, snap(firstTry, min(31)), 'r0', 1);
    for (let i = 1; i <= 21; i++) st = merge(st, snap(firstTry, min(2)), 'r' + i, 1);
    expect(Object.keys(st.sessions)).toHaveLength(20);
    expect(st.snapshot.secondsTotal).toBe(30 * 60 + 21 * 60);
  });
});
