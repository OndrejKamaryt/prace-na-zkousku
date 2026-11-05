/* Přepis referenčních check6.py a hiddencheck.py a kritéria z kapitoly 7,
   která referenční testy nehlídaly (R2): šířky 320 až 430 px, karty bez
   scrollování, skryté prvky ve shadow root opravdu nejsou vidět. */
import { expect, test } from '@playwright/test';
import { LAPTOP, MOBILE, open, openWithAi, scrollWidth, solveData, solveKyber } from './helpers.ts';

for (const vp of [MOBILE, LAPTOP]) {
  test(`kyberbezpečnost bez vodorovného přetečení, ${vp.width} px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/index.html?ukazka=kyber');
    let max = await scrollWidth(page);
    await solveKyber(page, async () => { max = Math.max(max, await scrollWidth(page)); });
    expect(max).toBeLessThanOrEqual(vp.width);
  });
}

test('hra na notebooku: plátno přes celou šířku rámečku, ostré a Hrát vidět bez scrollování', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/index.html?ukazka=hry');
  const canvas = page.locator('#g-canvas');
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0).toBeGreaterThan(0);
  const bb = (await canvas.boundingBox())!;
  const frame = (await page.locator('.canvas-box').boundingBox())!;
  expect(Math.abs(bb.width - frame.width)).toBeLessThanOrEqual(1);
  const px = await canvas.evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height, dpr: devicePixelRatio, cw: c.getBoundingClientRect().width }));
  expect(Math.abs(px.w - px.cw * Math.min(px.dpr, 2))).toBeLessThanOrEqual(1);
  expect(Math.abs(px.w / px.h - bb.width / bb.height), 'obraz plátna není deformovaný').toBeLessThan(0.01);
  const pb = (await page.locator('#g-play').boundingBox())!;
  expect(pb.y + pb.height).toBeLessThanOrEqual(LAPTOP.height);
  await page.locator('#g-play').click();
  await expect(page.locator('#g-jump')).toBeVisible();
  await expect(page.locator('#g-play')).toBeHidden();
});

test('hra na mobilu: plátno přes celou šířku rámečku a Hrát vidět bez scrollování', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await open(page, '/index.html?ukazka=hry');
  const canvas = page.locator('#g-canvas');
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0).toBeGreaterThan(0);
  const bb = (await canvas.boundingBox())!;
  const frame = (await page.locator('.canvas-box').boundingBox())!;
  expect(Math.abs(bb.width - frame.width)).toBeLessThanOrEqual(1);
  // na úzké obrazovce je plocha 12 × 7 přes celé plátno, bez kulis po stranách
  expect(Math.abs(bb.width / bb.height - 12 / 7)).toBeLessThan(0.02);
  const pb = (await page.locator('#g-play').boundingBox())!;
  expect(pb.y + pb.height).toBeLessThanOrEqual(MOBILE.height);
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

for (const vp of [MOBILE, LAPTOP]) {
  test(`data: nový krok začíná nahoře a Další krok je vidět po odpovědi, ${vp.width} px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/index.html?ukazka=data');
    await page.locator('#d-options [data-opt="2"]').click();
    await expect(page.locator('#d-next')).toBeInViewport({ ratio: 1 });
    await page.locator('#d-next').click();
    await expect(page.locator('#d-step .of')).toHaveText('krok 2 ze 3');
    const top = (await page.locator('#d-step').boundingBox())!.y;
    expect(top).toBeGreaterThanOrEqual(0);
    // na notebooku je stránka krátká a posunout se nemusí, na mobilu začíná krok nahoře
    if (vp === MOBILE) expect(top).toBeLessThanOrEqual(12);
    await page.locator('#d-options [data-opt="2"]').click();
    await expect(page.locator('#d-next')).toBeInViewport({ ratio: 1 });
    await page.locator('#d-next').click();
    await page.locator('#d-options [data-opt="0"]').click();
    await expect(page.locator('#d-fb')).toBeInViewport({ ratio: 1 });
    await page.locator('#d-options [data-opt="1"]').click();
    // výsledek ukázky i cesta k výsledku jsou vidět naráz
    await expect(page.locator('#d-end')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#d-done [data-go="vysledek"]')).toBeInViewport({ ratio: 1 });
  });
}

test('kyberbezpečnost na mobilu: po vyřešení je vidět Server je v bezpečí i Můj výsledek', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=kyber');
  await solveKyber(page);
  await expect(page.locator('#s-panel .step-no')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('#s-done [data-go="vysledek"]')).toBeInViewport({ ratio: 1 });
});

test('na mobilu jsou vidět všechny tři karty bez scrollování', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await open(page, '/index.html');
  const cards = page.locator('.path-card');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) await expect(card).toBeInViewport({ ratio: 1 });
});

for (const width of [320, 360, 390, 430]) {
  test(`šířka ${width} px: žádná obrazovka nepřetéká`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/index.html');
    expect(await scrollWidth(page), 'úvod').toBeLessThanOrEqual(width);

    await open(page, '/index.html?ukazka=hry');
    expect(await scrollWidth(page), 'hry').toBeLessThanOrEqual(width);

    await open(page, '/index.html?ukazka=kyber');
    expect(await scrollWidth(page), 'kyber').toBeLessThanOrEqual(width);

    await open(page, '/index.html?ukazka=data');
    for (const [opt, label] of [[2, 'data 1'], [2, 'data 2']] as const) {
      await page.locator(`#d-options [data-opt="${opt}"]`).click();
      expect(await scrollWidth(page), label).toBeLessThanOrEqual(width);
      await page.locator('#d-next').click();
    }
    expect(await scrollWidth(page), 'data 3').toBeLessThanOrEqual(width);
    await page.locator('#d-options [data-opt="1"]').click();
    await page.locator('#d-sql-box summary').click();
    expect(await scrollWidth(page), 'data hotovo').toBeLessThanOrEqual(width);
    await page.locator('.prog').click();
    expect(await scrollWidth(page), 'výsledek').toBeLessThanOrEqual(width);

    await openWithAi(page, '/index.html?ukazka=ai');
    await page.locator('[data-idea="kadernice"]').click();
    await page.locator('#a-bug .opt').first().click();
    await page.locator('#a-fix').click();
    for (const b of await page.locator('#a-changes .btn').all()) await b.click();
    expect(await scrollWidth(page), 'ai').toBeLessThanOrEqual(width);
  });
}

test('prvky s atributem hidden nejsou vidět na žádné obrazovce', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  const hiddenShown = () => page.evaluate(() => {
    const root = document.querySelector('prace-na-zkousku')!.shadowRoot!;
    return Array.from(root.querySelectorAll<HTMLElement>('[hidden]'))
      .filter(e => getComputedStyle(e).display !== 'none')
      .map(e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + e.className));
  });
  for (const view of ['', 'data', 'hry', 'kyber']) {
    await open(page, '/index.html' + (view ? '?ukazka=' + view : ''));
    expect(await hiddenShown(), view || 'úvod').toEqual([]);
  }
  await open(page, '/index.html?ukazka=data');
  await solveData(page);
  await page.locator('.prog').click();
  expect(await hiddenShown(), 'výsledek').toEqual([]);
});

test.fixme('dotykové cíle mají aspoň 44 px (fáze 6, S6 a R9)', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await openWithAi(page, '/index.html?ukazka=ai');
  await page.locator('[data-idea="navyky"]').click();
  const cell = (await page.locator('.hcell').first().boundingBox())!;
  expect(cell.width).toBeGreaterThanOrEqual(44);
});
