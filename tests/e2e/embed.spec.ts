/* Widget vložený do test-host.html, napodobeniny coderslab.cz (kapitola 7,
   „Widget na test-host.html“, a nálezy A1, A2, A7, A8, E2, E12, R3, V2-1):
   izolace stylů v obou směrech, hash stránky, posun pod lepicí hlavičku,
   překryvy nad hlavičkou, lištou cookies, poradcem i dolní lištou webu. */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LAPTOP, MOBILE, focused, hitsWidget, open, solveData, trackErrors } from './helpers.ts';

const hostTop = (page: Page) => page.evaluate(() => document.querySelector('prace-na-zkousku')!.getBoundingClientRect().top);

/** Odjede pod konec widgetu a klikne na „Zpět na výběr“ v Datové analýze bez automatického posunu Playwrightu. */
async function switchFromBelow(page: Page) {
  await page.evaluate(() => {
    const host = document.querySelector('prace-na-zkousku')!;
    window.scrollTo({ top: host.getBoundingClientRect().bottom + scrollY - 200, behavior: 'instant' });
  });
  expect(await hostTop(page)).toBeLessThan(0);
  await page.locator('#v-data .back').dispatchEvent('click');
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
  await page.locator('[data-claim="data"]').click();
  await page.locator('#cel [data-go="vysledek"]').click();
  await page.locator('#r-others [data-go="kyber"]').click();
  await page.locator('#v-kyber .back').click();
  await page.locator('.prog').click();
  expect(await page.evaluate(() => location.hash)).toBe('#kotva');
});

test('data-start otevře ukázku a ?ukazka má přednost', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/test-host.html?cookies=0&start=kyber');
  await expect(page.locator('#v-kyber')).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await open(page, '/test-host.html?cookies=0&start=kyber&ukazka=ai');
  await expect(page.locator('#v-ai')).toBeVisible();
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
    await expect(page.locator('#v-start')).toBeVisible();
    expect(Math.round(await hostTop(page))).toBe(o.top);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
    if (o.top > 0 && !o.query.includes('offset')) expect(await hitsWidget(page, 300, o.top + 4)).toBe('widget');
    // fokus na nadpis nové obrazovky, ne zpátky na začátek webu (A11)
    expect((await focused(page)).text).toBe('Vyzkoušej si práci v IT dřív, než se rozhodneš');
  });
}

test('okno s odznakem je nad lepicí hlavičkou, lištou cookies i poradcem', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/test-host.html?ukazka=data&podmenu=80');
  await page.locator('#d-options .opt').nth(2).dispatchEvent('click');
  await expect(page.locator('#d-done')).toBeVisible();
  // lišta cookies a poradce jsou na stránce vidět
  await expect(page.locator('#cookie-notice')).toBeVisible();
  await page.locator('[data-claim="data"]').dispatchEvent('click');
  await expect(page.locator('#cel')).toBeVisible();
  const icon = (await page.locator('#toastContactIcon').boundingBox())!;
  const cookie = (await page.locator('#cookie-notice').boundingBox())!;
  expect(await hitsWidget(page, 20, 20), 'lepicí hlavička').toBe('widget');
  expect(await hitsWidget(page, 20, cookie.y + cookie.height / 2), 'lišta cookies').toBe('widget');
  expect(await hitsWidget(page, icon.x + icon.width / 2, icon.y + icon.height / 2), 'ikona poradce').toBe('widget');
  await page.keyboard.press('Escape');
  await expect(page.locator('#cel')).toBeHidden();
  expect((await focused(page)).text).toBe('Zkusit další práci');
});

test('pruh s odznakem po vyřešení není schovaný pod lepicí hlavičkou (R3)', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/test-host.html?cookies=0&ukazka=data&podmenu=80');
  await page.evaluate(() => window.scrollTo({ top: document.querySelector('prace-na-zkousku')!.getBoundingClientRect().top + scrollY - 199, behavior: 'instant' }));
  await page.locator('#d-options .opt').nth(2).dispatchEvent('click');
  await expect(page.locator('#d-done')).toBeVisible();
  await page.waitForTimeout(600);
  const bar = (await page.locator('#d-done').boundingBox())!;
  expect(bar.y).toBeGreaterThanOrEqual(199 - 1);
  expect(bar.y + bar.height).toBeLessThanOrEqual(LAPTOP.height);
  expect(await hitsWidget(page, bar.x + 40, bar.y + 4)).toBe('widget');
});

test('mobil: okno s odznakem i Znám viníka jsou nad dolní lištou webu', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/test-host.html?cookies=0&ukazka=data');
  await page.locator('[data-dview="produkty"]').click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const fab = page.locator('#d-fab');
  await expect(fab).toBeVisible();
  const fb = (await fab.boundingBox())!;
  const nav = (await page.locator('.mobile-nav').boundingBox())!;
  expect(fb.y + fb.height, 'plovoucí tlačítko nad dolní lištou').toBeLessThanOrEqual(nav.y);
  expect(await hitsWidget(page, fb.x + fb.width / 2, fb.y + fb.height / 2)).toBe('widget');

  await fab.click();
  await page.locator('#d-options .opt').nth(2).click();
  await page.locator('[data-claim="data"]').click();
  await expect(page.locator('#cel')).toBeVisible();
  expect(await hitsWidget(page, nav.x + nav.width / 2, nav.y + nav.height / 2), 'dolní lišta pod oknem').toBe('widget');
  await page.locator('#cel [data-go="vysledek"]').click();
  await expect(page.locator('#v-vysledek')).toBeVisible();
  expect(Math.round(await hostTop(page))).toBe(0);
});

test('rozložení řídí šířka widgetu, ne okna (@container)', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/test-host.html?cookies=0');
  const wide = await page.evaluate(() => getComputedStyle(document.querySelector('prace-na-zkousku')!.shadowRoot!.querySelector('.paths')!).gridTemplateColumns.split(' ').length);
  expect(wide).toBe(4);
  await page.evaluate(() => { const h = document.querySelector<HTMLElement>('prace-na-zkousku')!; h.style.maxWidth = '420px'; h.style.margin = '0 auto'; });
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('prace-na-zkousku')!.shadowRoot!.querySelector('.paths')!).gridTemplateColumns.split(' ').length)).toBe(2);
  await expect(page.locator('.hero-art')).toBeHidden();
});
