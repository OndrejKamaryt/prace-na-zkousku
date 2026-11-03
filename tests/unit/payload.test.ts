import { describe, expect, it } from 'vitest';
import { buildPayload, MAX_BODY_BYTES, parseBody } from '../../src/logic/payload.ts';
import { answerData, changeApplied, createState, ideaBuilt, startIdea } from '../../src/logic/state.ts';
import { min } from './helpers.ts';

const TOKEN = '3f9c0e7a-5b1d-4c2e-9a8f-1d2e3f4a5b6c';
const SESSION = '0b6d2a3e-8c1f-4d5a-b7e9-2a4c6e8f0a1b';
const UTM = { source: 'facebook', medium: 'cpc', campaign: 'dta-podzim', content: 'video-a', term: '' };

function payload() {
  const s = createState('data', 'url', '/cz/prace-na-zkousku');
  answerData(s, true, min(1));
  startIdea(s, 'navyky', min(2)); ideaBuilt(s, 'navyky'); changeApplied(s, 'navyky', 'streak', min(3));
  return buildPayload(s, { token: TOKEN, session: SESSION, seq: 1, utm: UTM }, min(5));
}

describe('payload', () => {
  it('projde validací tam i zpět, i jako text/plain ze sendBeacon', () => {
    const p = payload();
    expect(parseBody(JSON.stringify(p))).toEqual({ ok: true, value: p });
  });
  it('převede token na malá písmena', () => {
    const p = { ...payload(), token: TOKEN.toUpperCase() };
    const r = parseBody(JSON.stringify(p));
    expect(r.ok && r.value.token).toBe(TOKEN);
  });
  it('odmítne neznámé pole, třeba volný text opener', () => {
    const r = parseBody(JSON.stringify({ ...payload(), opener: 'cokoli' }));
    expect(r).toEqual({ ok: false, error: 'payload.opener: neznámé pole' });
  });
  it('odmítne chybějící pole a špatné hodnoty', () => {
    const { goal: _, ...noGoal } = payload();
    expect(parseBody(JSON.stringify(noGoal)).ok).toBe(false);
    expect(parseBody(JSON.stringify({ ...payload(), fav: 'not:nic' })).ok).toBe(false);
    expect(parseBody(JSON.stringify({ ...payload(), token: 'abc' })).ok).toBe(false);
    const p = payload();
    p.paths.data.tries = -1;
    expect(parseBody(JSON.stringify(p))).toEqual({ ok: false, error: 'paths.data.tries: čekám celé číslo 0 až 4' });
  });
  it('odmítne tělo nad 10 kB a ne-JSON', () => {
    const big = JSON.stringify({ ...payload(), page: 'x'.repeat(MAX_BODY_BYTES) });
    expect(parseBody(big)).toEqual({ ok: false, error: 'tělo je větší než 10 kB' });
    expect(parseBody('nic')).toEqual({ ok: false, error: 'tělo není JSON' });
  });
  it('widget ořízne dlouhé a podezřelé UTM i cestu, server je přísný', () => {
    const s = createState('data', 'url', '/cz/<b>');
    const p = buildPayload(s, { token: TOKEN, session: SESSION, seq: 1, utm: { ...UTM, content: 'x'.repeat(250), source: '<img>fb' } }, min(5));
    expect([p.page, p.utm.source, p.utm.content.length]).toEqual(['', 'imgfb', 200]);
    expect(parseBody(JSON.stringify(p)).ok).toBe(true);
    expect(parseBody(JSON.stringify({ ...p, page: '/a <b>' })).ok).toBe(false);
    expect(parseBody(JSON.stringify({ ...p, utm: { ...p.utm, term: '<x>' } })).ok).toBe(false);
  });
  it('týden otevřená karta pořád projde', () => {
    const s = createState();
    answerData(s, false, min(0));
    const p = buildPayload(s, { token: TOKEN, session: SESSION, seq: 1, utm: UTM }, min(60 * 24 * 9));
    expect(parseBody(JSON.stringify(p)).ok).toBe(true);
  });
  it('odmítne neznámou aplikaci v ai.apps', () => {
    const p = payload() as unknown as { paths: { ai: { apps: Record<string, unknown> } } };
    p.paths.ai.apps.kalkulacka = { built: true, changes: 1 };
    expect(parseBody(JSON.stringify(p))).toEqual({ ok: false, error: 'paths.ai.apps.kalkulacka: neznámé pole' });
  });
});
