import { describe, expect, it } from 'vitest';
import { rate } from '../../src/logic/rating.ts';
import {
  answerData, changeApplied, createState, finish, finishData, gameDeath, gameEdit, gamePlay, gameSkip, gameWin, ideaBuilt,
  kyberAnswer, lowIncomeShown, openPath, setFirm, setGoal, snapshot, startIdea,
} from '../../src/logic/state.ts';
import { min, snap, solveData, T0 } from './helpers.ts';

const now = min(1);

describe('Datová analýza', () => {
  it('otevření ukázku nezačne, první odpověď ano', () => {
    const s = createState();
    openPath(s, 'data', now);
    expect(s.data.status).toBe('not_started');
    answerData(s, true, now);
    expect(s.data.status).toBe('in_progress');
  });
  it('hotová je až po posledním kroku, ne po správné odpovědi', () => {
    const s = createState();
    for (let i = 0; i < 3; i++) expect(answerData(s, true, now)).toBe('solved');
    expect(s.data.status).toBe('in_progress');
    expect(finishData(s, now)).toBe(true);
    expect(s.data.status).toBe('done');
    expect(finishData(s, now)).toBe(false);
  });
  it('great bez chyby, average s chybami, bad po odhalení', () => {
    const clean = snap(s => solveData(s));
    expect(clean.paths.data).toMatchObject({ status: 'done', firstTry: true, mistakes: 0, revealed: false });
    expect(rate('data', clean.paths)).toBe('great');
    // po jedné chybě ve dvou krocích: dvě chyby, ale žádná správná odpověď ukázaná nástrojem
    const two = snap(s => solveData(s, [1, 1, 0]));
    expect(two.paths.data).toMatchObject({ firstTry: false, mistakes: 2, revealed: false });
    expect(rate('data', two.paths)).toBe('average');
    const revealed = snap(s => solveData(s, [2, 0, 0]));
    expect(revealed.paths.data).toMatchObject({ firstTry: false, mistakes: 2, revealed: true, status: 'done' });
    expect(rate('data', revealed.paths)).toBe('bad');
  });
  it('po dvou špatných v kroku ukáže správnou a počítá se znovu v dalším', () => {
    const s = createState();
    expect(answerData(s, false, now)).toBe('wrong');
    expect(answerData(s, false, now)).toBe('revealed');
    expect(answerData(s, false, now)).toBe('wrong');
    expect(answerData(s, true, now)).toBe('solved');
    expect(answerData(s, false, now)).toBe('wrong');
    expect(s.data.mistakes).toBe(4);
  });
  it('správná odpověď vynuluje chyby v kroku', () => {
    const s = createState();
    answerData(s, false, now);
    answerData(s, true, now);
    expect(answerData(s, false, now)).toBe('wrong');
  });
  it('rozpracovaná bez dokončení nemá hodnocení', () => {
    expect(rate('data', snap(s => answerData(s, true, now)).paths)).toBeNull();
  });
  it('po dokončení další odpovědi nic nemění', () => {
    const s = createState();
    solveData(s);
    expect(answerData(s, false, now)).toBe('ignored');
    expect(s.data.mistakes).toBe(0);
  });
  it('snímek neobsahuje pomocné počítadlo kroku', () => {
    const s = createState();
    answerData(s, false, now);
    expect(Object.keys(snapshot(s, now).paths.data).sort()).toEqual(['firstTry', 'mistakes', 'revealed', 'seconds', 'status']);
  });
});

describe('Stavění s AI', () => {
  it('odznak až po první provedené úpravě', () => {
    const s = createState();
    startIdea(s, 'uctenka', now);
    expect(changeApplied(s, 'uctenka', 'tip', now)).toBe(false); // aplikace ještě nestojí
    ideaBuilt(s, 'uctenka');
    expect(s.ai.status).toBe('in_progress');
    expect(rate('ai', snapshot(s, now).paths)).toBe('bad');
    expect(changeApplied(s, 'uctenka', 'tip', now)).toBe(true);
    expect(changeApplied(s, 'uctenka', 'round', now)).toBe(false);
    expect(rate('ai', snapshot(s, now).paths)).toBe('great');
  });
  it('úpravy se počítají po aplikacích a stejná úprava jen jednou', () => {
    const s = createState();
    startIdea(s, 'uctenka', now); ideaBuilt(s, 'uctenka');
    changeApplied(s, 'uctenka', 'tip', now);
    startIdea(s, 'uctenka', now); ideaBuilt(s, 'uctenka');
    changeApplied(s, 'uctenka', 'tip', now);
    startIdea(s, 'navyky', now); ideaBuilt(s, 'navyky');
    changeApplied(s, 'navyky', 'streak', now);
    const p = snapshot(s, now).paths;
    expect(p.ai.apps).toEqual({ uctenka: { built: true, changes: 1 }, navyky: { built: true, changes: 1 } });
    expect(p.ai.ideasTried).toBe(3);
    expect(rate('ai', p)).toBe('average');
  });
});

describe('Tvorba her', () => {
  it('přeskočení nedává odznak a hodnotí se bad', () => {
    const s = createState();
    for (let i = 0; i < 6; i++) { gamePlay(s, false, now); gameDeath(s); }
    gameSkip(s, now);
    expect(s.hry.status).toBe('skipped');
    expect(rate('hry', snapshot(s, now).paths)).toBe('bad');
  });
  it('výchozí level average, vlastní level great a odznak', () => {
    const s = createState();
    gamePlay(s, false, now);
    expect(gameWin(s, false, 3, now)).toBe(false);
    expect(rate('hry', snapshot(s, now).paths)).toBe('average');
    gameEdit(s, now);
    gamePlay(s, true, now); gameDeath(s);
    gamePlay(s, true, now);
    expect(gameWin(s, true, 5, now)).toBe(true);
    expect(snapshot(s, now).paths.hry).toMatchObject({ status: 'done', ownWon: true, winAttempt: 2, bestCoins: 5, deaths: 1 });
    expect(rate('hry', snapshot(s, now).paths)).toBe('great');
  });
  it('výchozí level dohraný a pak přeskočení je average', () => {
    const s = createState();
    gamePlay(s, false, now); gameWin(s, false, 1, now); gameSkip(s, now);
    expect(rate('hry', snapshot(s, now).paths)).toBe('average');
  });
  it('dohraný vlastní level už přeskočení nezmění', () => {
    const s = createState();
    gameEdit(s, now); gamePlay(s, true, now); gameWin(s, true, 0, now); gameSkip(s, now);
    expect(s.hry.status).toBe('done');
  });
});

describe('Kyberbezpečnost', () => {
  it.each([[3, 'great'], [2, 'average'], [1, 'average'], [0, 'bad']] as const)('%i napoprvé = %s', (ok, rating) => {
    const p = snap(s => {
      for (let i = 0; i < 3; i++) {
        if (i >= ok) kyberAnswer(s, false, true, now);
        kyberAnswer(s, true, i < ok, now);
      }
      finish(s, 'kyber', now);
    }).paths;
    expect(p.kyber.firstOk).toBe(ok);
    expect(rate('kyber', p)).toBe(rating);
  });
  it('nedokončená nemá hodnocení', () => {
    expect(rate('kyber', snap(s => kyberAnswer(s, true, true, now)).paths)).toBeNull();
  });
});

describe('snapshot', () => {
  it('zájem o školení přes firmu platí jen u cíle zlepšit se', () => {
    const s = createState();
    setGoal(s, 'upskill'); setFirm(s, true);
    expect(snapshot(s, now).firmInterest).toBe(true);
    setGoal(s, 'switch');
    expect(snapshot(s, now).firmInterest).toBe(false);
  });
  it('nízkopříjmová skupina je null, dokud se otázka neukázala', () => {
    const s = createState();
    expect(snapshot(s, now).lowIncome).toBeNull();
    lowIncomeShown(s);
    expect(snapshot(s, now).lowIncome).toBe(false);
  });
  it('čas běží od otevření ukázky, rozpracovaná je až po první akci', () => {
    const s = createState();
    openPath(s, 'data', min(0));
    expect(s.data.status).toBe('not_started');
    solveData(s, [0, 0, 0], min(5));
    expect(snapshot(s, min(6)).paths.data.seconds).toBe(300);
  });
  it('minuty zaokrouhlí jako mins() v prototypu (89,5 s = 1 min)', () => {
    const s = createState();
    answerData(s, false, T0);
    solveData(s, [0, 0, 0], T0 + 89_500);
    expect(snapshot(s, T0 + 89_500).paths.data.seconds).toBe(89);
  });
  it('počítá čas od první akce', () => {
    const s = createState();
    answerData(s, false, min(1));
    solveData(s, [0, 0, 0], min(4));
    const p = snapshot(s, min(9));
    expect(p.paths.data.seconds).toBe(180);
    expect(p.paths.ai.seconds).toBe(0);
    expect(p.secondsTotal).toBe(480);
  });
});
