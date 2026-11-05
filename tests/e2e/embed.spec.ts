/* Widget vložený do test-host.html, napodobeniny coderslab.cz (kapitola 7,
   „Widget na test-host.html“, a nálezy A1, A2, A7, A8, E2, E12, R3, V2-1):
   izolace stylů v obou směrech, hash stránky, posun pod lepicí hlavičku
   a odstup od dolní lišty webu. */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LAPTOP, MOBILE, focused, hitsWidget, open, solveData, trackErrors, widgetState } from './helpers.ts';

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

test('mobil: Další krok není schovaný pod dolní lištou webu', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/test-host.html?cookies=0&ukazka=data');
  await page.locator('#d-options [data-opt="2"]').click();
  await expect(page.locator('#d-next')).toBeVisible();
  const next = (await page.locator('#d-next').boundingBox())!;
  const nav = (await page.locator('.mobile-nav').boundingBox())!;
  expect(next.y + next.height, 'tlačítko nad dolní lištou').toBeLessThanOrEqual(nav.y);
  expect(await hitsWidget(page, next.x + next.width / 2, next.y + next.height / 2)).toBe('widget');

  // nový krok začíná pod horním okrajem, na mobilu web lepicí hlavičku nemá
  await page.locator('#d-next').click();
  await expect(page.locator('#d-step .of')).toHaveText('krok 2 ze 3');
  const top = (await page.locator('#d-step').boundingBox())!.y;
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThanOrEqual(12);

  await page.locator('#d-options [data-opt="2"]').click();
  await page.locator('#d-next').click();
  await page.locator('#d-options [data-opt="1"]').click();
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
