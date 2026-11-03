/* Přepis referenčních check6.py a hiddencheck.py a kritéria z kapitoly 7,
   která referenční testy nehlídaly (R2): šířky 320 až 430 px, čtyři karty
   bez scrollování, skryté prvky ve shadow root opravdu nejsou vidět. */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LAPTOP, MOBILE, open, scrollWidth } from './helpers.ts';

async function kyberAll(page: Page, onStep: () => Promise<void>) {
  for (const sel of ['[data-cmd="grep"]', '[data-cmd="count"]', '[data-q1="0"]', '[data-cmd="ufw"]', '[data-cmd="last"]', '[data-q2="1"]']) {
    await page.locator(sel).click();
    await onStep();
  }
  await page.locator('#s-k1').check();
  await page.locator('#s-k2').check();
  await page.locator('[data-act="deploy"]').click();
  await expect(page.locator('#s-done')).toBeVisible({ timeout: 10_000 });
  await onStep();
}

for (const vp of [MOBILE, LAPTOP]) {
  test(`kyberbezpečnost bez vodorovného přetečení, ${vp.width} px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/index.html?ukazka=kyber');
    let max = await scrollWidth(page);
    await kyberAll(page, async () => { max = Math.max(max, await scrollWidth(page)); });
    expect(max).toBeLessThanOrEqual(vp.width);
  });
}

test('hra na notebooku: plátno ostré a nedeformované, Hrát vidět bez scrollování', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/index.html?ukazka=hry');
  const canvas = page.locator('#g-canvas');
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0).toBeGreaterThan(0);
  const bb = (await canvas.boundingBox())!;
  expect(Math.abs(bb.width / bb.height - 12 / 7)).toBeLessThan(0.01);
  const px = await canvas.evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height, dpr: devicePixelRatio, cw: c.getBoundingClientRect().width }));
  expect(Math.abs(px.w - px.cw * Math.min(px.dpr, 2))).toBeLessThanOrEqual(1);
  const pb = (await page.locator('#g-play').boundingBox())!;
  expect(pb.y + pb.height).toBeLessThanOrEqual(LAPTOP.height);
  await page.locator('#g-play').click();
  await expect(page.locator('#g-jump')).toBeVisible();
  await expect(page.locator('#g-play')).toBeHidden();
});

test('plátno je ostré i na displeji s vyšší hustotou', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: MOBILE, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await open(page, '/index.html?ukazka=hry');
  const canvas = page.locator('#g-canvas');
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0).toBeGreaterThan(0);
  const px = await canvas.evaluate((c: HTMLCanvasElement) => ({ w: c.width, cw: c.getBoundingClientRect().width }));
  expect(Math.abs(px.w - px.cw * 2)).toBeLessThanOrEqual(1);
  await ctx.close();
});

test('Znám viníka: po druhém pohledu, když jsou odpovědi mimo obrazovku, a zmizí u odpovědí', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await open(page, '/index.html?ukazka=data');
  const fab = page.locator('#d-fab');
  await expect(fab).toBeHidden();
  await page.locator('[data-dview="produkty"]').click();
  await expect(fab).toBeVisible();
  await fab.click();
  await expect(fab).toBeHidden();
  await expect(page.locator('#d-options')).toBeInViewport({ ratio: 0.25 });
});

test('Znám viníka se na notebooku neukáže', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/index.html?ukazka=data');
  await page.locator('[data-dview="produkty"]').click();
  await page.locator('[data-dview="dny"]').click();
  await page.mouse.wheel(0, 2000);
  await expect(page.locator('#d-fab')).toBeHidden();
});

test('na mobilu jsou vidět všechny čtyři karty bez scrollování', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await open(page, '/index.html');
  const cards = page.locator('.path-card');
  await expect(cards).toHaveCount(4);
  for (const card of await cards.all()) await expect(card).toBeInViewport({ ratio: 1 });
});

for (const width of [320, 360, 390, 430]) {
  test(`šířka ${width} px: žádná obrazovka nepřetéká`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const view of ['', 'data', 'ai', 'hry', 'kyber']) {
      await open(page, '/index.html' + (view ? '?ukazka=' + view : ''));
      if (view === 'ai') {
        await page.locator('[data-idea="kadernice"]').click();
        for (const b of await page.locator('#a-changes .btn').all()) await b.click();
      }
      if (view === 'data') {
        for (const t of await page.locator('[data-dview]').all()) await t.click();
        await page.locator('#d-options .opt').nth(2).click();
        await page.locator('#d-sql-box summary').click();
      }
      expect(await scrollWidth(page), view || 'úvod').toBeLessThanOrEqual(width);
    }
    await page.locator('.prog').click();
    expect(await scrollWidth(page), 'výsledek').toBeLessThanOrEqual(width);
  });
}

test('prvky s atributem hidden nejsou vidět na žádné obrazovce', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  for (const view of ['', 'data', 'ai', 'hry', 'kyber', 'vysledek']) {
    await open(page, '/index.html' + (view && view !== 'vysledek' ? '?ukazka=' + view : ''));
    if (view === 'vysledek') await page.locator('.prog').click();
    const shown = await page.evaluate(() => {
      const root = document.querySelector('prace-na-zkousku')!.shadowRoot!;
      return Array.from(root.querySelectorAll<HTMLElement>('[hidden]'))
        .filter(e => getComputedStyle(e).display !== 'none')
        .map(e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + e.className));
    });
    expect(shown, view || 'úvod').toEqual([]);
  }
});

test.fixme('dotykové cíle mají aspoň 44 px (fáze 6, S6 a R9)', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await open(page, '/index.html?ukazka=ai');
  await page.locator('[data-idea="navyky"]').click();
  const cell = (await page.locator('.hcell').first().boundingBox())!;
  expect(cell.width).toBeGreaterThanOrEqual(44);
});
