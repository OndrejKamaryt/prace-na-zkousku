/* Widget vložený do test-host.html, napodobeniny coderslab.cz (kapitola 7,
   „Widget na test-host.html“, a nálezy A1, A2, A7, A8, E2, E12, R3, V2-1):
   izolace stylů v obou směrech, hash stránky, posun pod lepicí hlavičku
   a odstup od dolní lišty webu. */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { KYBER_MOVES, LAPTOP, MOBILE, dataBar, dataOpt, focused, hitsWidget, open, solveData, trackErrors, widgetState } from './helpers.ts';

const hostTop = (page: Page) => page.evaluate(() => document.querySelector('prace-na-zkousku')!.getBoundingClientRect().top);

/** Odjede pod konec widgetu a klikne na další příklad v Datové analýze bez automatického posunu Playwrightu. */
async function switchFromBelow(page: Page) {
  await page.evaluate(() => {
    const host = document.querySelector('prace-na-zkousku')!;
    window.scrollTo({ top: host.getBoundingClientRect().bottom + scrollY - 200, behavior: 'instant' });
  });
  expect(await hostTop(page)).toBeLessThan(0);
  await page.locator('#v-data [data-more] [data-go="kyber"]').dispatchEvent('click');
}

test('styly webu se do widgetu nepropisují a widget nemění stránku', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  const errors = trackErrors(page);
  await open(page, '/test-host.html?cookies=0');
  const host = await page.evaluate(() => {
    const btn = getComputedStyle(document.getElementById('host-btn')!);
    const lead = getComputedStyle(document.getElementById('host-lead')!);
    return {
      bootstrap: btn.borderRadius, btnFont: btn.fontFamily, leadSize: lead.fontSize, bodyLine: getComputedStyle(document.body).lineHeight,
      rootToken: getComputedStyle(document.documentElement).getPropertyValue('--yellow'),
      headStyles: document.head.querySelectorAll('style, link[rel="stylesheet"]').length,
    };
  });
  // Bootstrap 5.2.3 na stránce opravdu platí a widget ho nezměnil
  expect(host).toMatchObject({ bootstrap: '6px', leadSize: '20px', bodyLine: '24px', rootToken: '', headStyles: 4 });
  expect(host.btnFont).toContain('Ubuntu');

  const inside = await page.evaluate(() => {
    const root = document.querySelector('prace-na-zkousku')!.shadowRoot!;
    const cs = (sel: string) => getComputedStyle(root.querySelector(sel)!);
    return {
      lede: cs('.lede').lineHeight, ledeFont: cs('.lede').fontFamily, h1: cs('#v-start h1').fontWeight,
      pMargin: cs('.lede').marginBottom, btnRadius: cs('.prog').borderRadius, h3: cs('.path-card h3').fontSize,
    };
  });
  // Bootstrap dává p margin 1rem, h3 1.75rem a body line-height 1.5; ve widgetu platí jen jeho styly
  expect(inside.pMargin).toBe('0px');
  expect(inside.h3).toBe('20px');
  expect(inside.btnRadius).toBe('999px');
  expect(inside.h1).toBe('700');
  expect(inside.ledeFont).toContain('Open Sans');
  expect(parseFloat(inside.lede) / 19).toBeCloseTo(1.6, 1);
  expect(errors).toEqual([]);
});

test('hash stránky zůstává beze změny a načtení stránkou neposune', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/test-host.html?cookies=0&ukazka=data#kotva');
  await expect(page.locator('#v-data')).toBeVisible();
  expect(await page.evaluate(() => scrollY), 'první vykreslení neposouvá (V2-1)').toBe(0);
  await solveData(page);
  await page.locator('#d-done [data-go="vysledek"]').click();
  await page.locator('#r-others [data-go="kyber"]').click();
  await page.locator('#v-kyber [data-more] [data-go="hry"]').click();
  await page.locator('.prog').click();
  expect(await page.evaluate(() => location.hash)).toBe('#kotva');
});

test('data-start otevře ukázku, ?ukazka má přednost a schovaná ukázka se neotevře', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/test-host.html?cookies=0&start=kyber');
  await expect(page.locator('#v-kyber')).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await open(page, '/test-host.html?cookies=0&start=kyber&ukazka=hry');
  await expect(page.locator('#v-hry')).toBeVisible();
  await open(page, '/test-host.html?cookies=0&start=kyber&ukazka=ai');
  await expect(page.locator('#v-kyber')).toBeVisible();
  await open(page, '/test-host.html?cookies=0&start=ai');
  await expect(page.locator('#v-start')).toBeVisible();
});

const OFFSETS = [
  { name: 'stránka kurzu s podmenu 80 px', size: LAPTOP, query: '&podmenu=80', top: 199 },
  { name: 'podmenu 56 px', size: LAPTOP, query: '', top: 175 },
  { name: 'bez podmenu', size: LAPTOP, query: '&podmenu=0', top: 119 },
  { name: 'mezi 992 a 1199 px jen růžový pruh', size: { width: 1100, height: 768 }, query: '', top: 60 },
  { name: 'mobil bez lepicí hlavičky', size: MOBILE, query: '', top: 0 },
  { name: 'ruční data-scroll-offset', size: LAPTOP, query: '&podmenu=80&offset=50', top: 50 },
];
for (const o of OFFSETS) {
  test(`přepnutí obrazovky posune widget pod hlavičku: ${o.name}`, async ({ page }) => {
    await page.setViewportSize(o.size);
    await open(page, '/test-host.html?cookies=0&ukazka=data' + o.query);
    await switchFromBelow(page);
    await expect(page.locator('#v-kyber')).toBeVisible();
    expect(Math.round(await hostTop(page))).toBe(o.top);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
    if (o.top > 0 && !o.query.includes('offset')) expect(await hitsWidget(page, 300, o.top + 4)).toBe('widget');
    // fokus na nadpis nové obrazovky, ne zpátky na začátek webu (A11)
    expect((await focused(page)).text).toBe('Někdo se dobývá do serveru pekárny');
  });
}

test('widget nemá okno ani vrstvu nad stránkou a pruh s výsledkem se ukáže až po první ukázce', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/test-host.html?cookies=0&ukazka=data&podmenu=80');
  await expect(page.locator('dialog, [popover], canvas.confetti')).toHaveCount(0);
  await expect(page.locator('.pnz-bar')).toBeHidden();
  await solveData(page);
  await expect(page.locator('dialog, [popover], canvas.confetti')).toHaveCount(0);
  await expect(page.locator('.pnz-bar .prog')).toHaveText('Můj výsledek');
  await page.locator('.pnz-bar .prog').click();
  await expect(page.locator('#v-vysledek')).toBeVisible();
  expect((await focused(page)).text).toBe('Datová analýza');
});

test('výsledek ukázky a pruh Hotovo nejsou schované pod lepicí hlavičkou (R3)', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/test-host.html?cookies=0&ukazka=data&podmenu=80');
  await page.evaluate(() => window.scrollTo({ top: document.querySelector('prace-na-zkousku')!.getBoundingClientRect().top + scrollY - 199, behavior: 'instant' }));
  await solveData(page);
  const panel = (await page.locator('#d-step').boundingBox())!;
  const bar = (await page.locator('#d-done').boundingBox())!;
  expect(panel.y).toBeGreaterThanOrEqual(199 - 1);
  expect(bar.y + bar.height).toBeLessThanOrEqual(LAPTOP.height);
  expect(await hitsWidget(page, panel.x + 40, panel.y + 4)).toBe('widget');
  expect(await hitsWidget(page, bar.x + 40, bar.y + 4)).toBe('widget');
});

test('mobil: volby v datové ukázce nejsou schované pod dolní lištou webu', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/test-host.html?cookies=0&ukazka=data');
  await dataOpt(page, 1);
  const last = page.locator('#d-options .act').last();
  await expect(last).toBeVisible();
  const box = (await last.boundingBox())!;
  const nav = (await page.locator('.mobile-nav').boundingBox())!;
  expect(box.y + box.height, 'volba nad dolní lištou').toBeLessThanOrEqual(nav.y);
  expect(await hitsWidget(page, box.x + box.width / 2, box.y + box.height / 2)).toBe('widget');

  // nový graf začíná pod horním okrajem, na mobilu web lepicí hlavičku nemá
  await dataOpt(page, 2);
  await expect(page.locator('#d-chart')).toBeVisible();
  const top = (await page.locator('#d-clues').boundingBox())!.y;
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThanOrEqual(12);

  for (const [move, n] of [[dataBar, 2], [dataOpt, 0], [dataBar, 5], [dataOpt, 1], [dataBar, 2], [dataOpt, 2]] as const) await move(page, n);
  await expect(page.locator('#d-done')).toBeVisible();
  expect((await widgetState(page)).data.status).toBe('done');
  await page.locator('#d-done [data-go="vysledek"]').click();
  await expect(page.locator('#v-vysledek')).toBeVisible();
  expect(Math.round(await hostTop(page))).toBe(0);
});

test('rozložení řídí šířka widgetu, ne okna (@container)', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/test-host.html?cookies=0');
  const wide = await page.evaluate(() => getComputedStyle(document.querySelector('prace-na-zkousku')!.shadowRoot!.querySelector('.paths')!).gridTemplateColumns.split(' ').length);
  expect(wide).toBe(3);
  await page.evaluate(() => { const h = document.querySelector<HTMLElement>('prace-na-zkousku')!; h.style.maxWidth = '420px'; h.style.margin = '0 auto'; });
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('prace-na-zkousku')!.shadowRoot!.querySelector('.paths')!).gridTemplateColumns.split(' ').length)).toBe(1);
  await expect(page.locator('.hero-art')).toBeHidden();
});

test('IT admin pod lepicí hlavičkou webu: po startu je celý herní box vidět a pruh s výsledkem je schovaný', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/test-host.html?cookies=0&ukazka=kyber&podmenu=80');
  await page.locator('#s-start').click();
  await expect(page.locator('[data-cmd="grep"]')).toBeEnabled();
  await expect.poll(async () => Math.round((await page.locator('#s-stage').boundingBox())!.y)).toBeGreaterThanOrEqual(199);
  const stage = (await page.locator('#s-stage').boundingBox())!;
  expect(stage.y + stage.height).toBeLessThanOrEqual(LAPTOP.height);
  expect(await hitsWidget(page, stage.x + 40, stage.y + 4)).toBe('widget');
  for (const sel of KYBER_MOVES.slice(1)) await page.locator(sel).click();
  await expect(page.locator('#s-result')).toBeVisible({ timeout: 15_000 });
  // „Co dál?“ je jediná cesta dál: pruh „Můj výsledek“ se u IT admina neukáže
  await expect(page.locator('.pnz-bar')).toBeHidden();
  const next = (await page.locator('#s-next').boundingBox())!;
  expect(next.y).toBeGreaterThanOrEqual(199);
  expect(next.y + next.height).toBeLessThanOrEqual(LAPTOP.height);
  // na jiné ukázce se pruh s výsledkem vrátí
  await page.locator('#v-kyber [data-more] [data-go="data"]').click();
  await expect(page.locator('.pnz-bar .prog')).toBeVisible();
});

test('analytika: IT admin v iframe posílá události stránce nad sebou ve správném pořadí a bez osobních údajů', async ({ page, context }) => {
  test.setTimeout(90_000);
  // odkazy na web Coders Labu se otevřou v nové záložce, test je obslouží sám
  await context.route(/coderslab\.cz/, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>ok</title>' }));
  await page.route('**/iframe-host.html', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><meta charset="utf-8"><body style="margin:0"><iframe src="/index.html?ukazka=kyber" style="width:1300px;height:900px;border:0"></iframe>' +
      '<script>window.got = []; addEventListener("message", e => { if (e.data && e.data.source === "prace-na-zkousku") window.got.push(e.data); });</script></body>',
  }));
  // CustomEvent na prvku widgetu se zapisuje přímo v iframe, od prvního vykreslení
  await page.addInitScript(() => {
    const w = window as unknown as { custom: unknown[] };
    w.custom = [];
    document.addEventListener('prace-na-zkousku', e => w.custom.push((e as CustomEvent).detail));
  });
  await page.setViewportSize({ width: 1366, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/iframe-host.html');
  const app = page.frameLocator('iframe');
  await expect(app.locator('#s-start')).toBeVisible();

  // první hra s jednou chybou, pak znovu, pak Co dál, webinář a detail kurzu
  await app.locator('#s-start').click();
  for (const sel of ['[data-cmd="grep"]', '[data-cmd="count"]', '[data-q1="1"]', '#s-retry']) await app.locator(sel).click();
  for (const sel of ['[data-q1="0"]', '[data-cmd="ufw"]', '[data-cmd="last"]', '[data-q2="1"]', '[data-shield="klic"]', '[data-shield="fail2ban"]', '#s-deploy']) await app.locator(sel).click();
  await expect(app.locator('#s-result')).toBeVisible({ timeout: 15_000 });
  await app.locator('#s-replay').click();
  for (const sel of KYBER_MOVES.slice(1)) await app.locator(sel).click();
  await expect(app.locator('#s-result')).toBeVisible({ timeout: 15_000 });
  await app.locator('#s-next').click();
  await expect(app.locator('#r-reco h2')).toHaveText('Kyberbezpečnost');
  for (const name of ['Webinář zdarma', 'Detail kurzu']) {
    const popup = page.waitForEvent('popup');
    await app.locator('#r-next a', { hasText: name }).click();
    await (await popup).close();
  }

  const got = await page.evaluate(() => (window as unknown as { got: Record<string, unknown>[] }).got);
  const frame = page.frames().find(f => f.url().includes('index.html'))!;
  const custom = await frame.evaluate(() => (window as unknown as { custom: unknown[] }).custom);
  expect(custom, 'CustomEvent na widgetu nese totéž co postMessage').toEqual(got);

  const step = (n: number, wrong: number, replay: boolean) => ({ event: 'step_complete', step: n, wrong_count: wrong, replay });
  const brief = got.map(e => {
    const { source, game, time, ...rest } = e;
    expect(source).toBe('prace-na-zkousku');
    expect(game).toBe('kyber');
    if (time !== undefined) expect(typeof time).toBe('number');
    return rest;
  });
  expect(brief).toEqual([
    { event: 'game_view' },
    { event: 'game_start', replay: false },
    { event: 'wrong_answer', step: 1, option: '198.51.100.23', replay: false },
    step(1, 1, false), step(2, 0, false), step(3, 0, false),
    { event: 'game_finish', stars: 2, replay: false },
    { event: 'replay_click' },
    { event: 'game_start', replay: true },
    step(1, 0, true), step(2, 0, true), step(3, 0, true),
    { event: 'game_finish', stars: 3, replay: true },
    { event: 'result_cta_click' },
    { event: 'webinar_click' },
    { event: 'course_detail_click' },
  ]);
  // bez osobních údajů: jen povolené klíče a krátké hodnoty
  const allowed = new Set(['source', 'event', 'game', 'step', 'time', 'wrong_count', 'option', 'stars', 'replay']);
  for (const e of got) {
    for (const [k, v] of Object.entries(e)) {
      expect(allowed.has(k), k).toBe(true);
      expect(['string', 'number', 'boolean']).toContain(typeof v);
      if (typeof v === 'string') expect(v.length).toBeLessThanOrEqual(40);
    }
  }
  // do stavu pro Pipedrive se počítá jen první hra
  expect(await frame.evaluate(() => (document.querySelector('prace-na-zkousku') as unknown as { state: { kyber: unknown } }).state.kyber)).toMatchObject({ status: 'done', firstOk: 2, mistakes: 1 });
});
