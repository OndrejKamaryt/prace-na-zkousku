/* Přepis referenčního gametest.py: hra se po pádu sama nespouští, po třech
   pádech se odemkne editor a vlastní verze jde dohrát. Navíc přeskočení hry
   podle rozhodnutí 7 (karta „Přeskočeno“). Čeká se na stav hry, ne na pevné
   časy, protože herní čas závisí na snímkové frekvenci (R10). */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { LAPTOP, MOBILE, open, trackErrors, widgetState } from './helpers.ts';

async function dieOnce(page: Page, n: number) {
  await page.locator('#g-play').click();
  await expect(page.locator('#g-jump')).toBeVisible();
  await expect.poll(async () => (await widgetState(page)).hry.deaths, { timeout: 10_000 }).toBe(n);
}

/** Klepnutí do buňky plochy 12 × 7. Plocha je uprostřed plátna, po stranách je jen kulisa. */
async function tapCell(page: Page, c: number, r: number) {
  const box = (await page.locator('#g-canvas').boundingBox())!;
  const tile = box.height / 7, left = (box.width - tile * 12) / 2;
  await page.mouse.click(box.x + left + (c + 0.5) * tile, box.y + (r + 0.5) * tile);
}

for (const vp of [MOBILE, LAPTOP]) {
  test(`po pádu se hra nespouští, po třech pádech editor a vlastní verze jde dohrát, ${vp.width} px`, async ({ page }) => {
    await page.setViewportSize(vp);
    // bez plynulého posouvání: klepání do plochy počítá s klidnou stránkou
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = trackErrors(page);
    await open(page, '/index.html?ukazka=hry');
    await expect(page.locator('#v-hry h2')).toHaveText('Zahraj si hru a pak ji uprav');
    await expect(page.locator('#v-hry .sub')).toContainText('Běžíš z Coders Labu do svého prvního herního studia.');
    await expect(page.locator('#g-status')).toHaveText('Zmáčkni Hrát a pak klepni kamkoli do hry.');
    await expect(page.locator('#g-tools')).toBeHidden();

    // po pádu je Hrát znovu chvíli neaktivní; okno 900 ms se pod zátěží snadno mine, proto ho zapisuje pozorovatel
    await page.evaluate(() => {
      const b = document.querySelector('prace-na-zkousku')!.shadowRoot!.querySelector('#g-play')!;
      new MutationObserver(() => { if (b.hasAttribute('disabled')) (window as unknown as { pnzHeld?: boolean }).pnzHeld = true; })
        .observe(b, { attributes: true, attributeFilter: ['disabled'] });
    });
    await dieOnce(page, 1);
    const status = page.locator('#g-status');
    await expect(status).toHaveText('Spadla do díry. Zmáčkni Hrát znovu a zkus to ještě jednou.');
    const play = page.locator('#g-play');
    await expect(play).toHaveText('Hrát znovu');
    await expect(play).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { pnzHeld?: boolean }).pnzHeld), 'Hrát znovu bylo po pádu neaktivní').toBe(true);
    await expect(page.locator('#g-jump')).toBeHidden();
    await expect(play).toBeEnabled({ timeout: 2_000 });
    await page.waitForTimeout(2_000);
    expect((await widgetState(page)).hry.plays, 'hra se po pádu sama nespustila').toBe(1);
    await expect(page.locator('#g-jump')).toBeHidden();

    await dieOnce(page, 2);
    await dieOnce(page, 3);
    await expect(status).toContainText('Životy došly, ale nevadí, i herní designéři ladí obtížnost. Uprav hru, aby šla projít');
    await expect(page.locator('#g-tools')).toBeVisible();
    await expect(page.locator('[data-gstep="1"]')).toHaveClass(/\bok\b/);

    await tapCell(page, 4, 6);
    await tapCell(page, 5, 6);
    await page.locator('[data-tool="0"]').click();
    await tapCell(page, 8, 5);
    expect((await widgetState(page)).hry.edits).toBe(3);
    await play.click();
    // při hraní nástroje zmizí, aby na obrazovce bylo jen to nutné
    await expect(page.locator('#g-tools')).toBeHidden();
    await expect(status).toContainText('Tvoje verze hry je dohraná! Každý bug navíc je 50 bodů', { timeout: 10_000 });
    // karta s hvězdami a body je jen na plátně, kam klepnutí dál projde
    const card = page.locator('#g-card');
    await expect(card).toContainText('Tvoje hra je dohraná!');
    await expect(card).toContainText('Nový rekord!');
    await expect(card).toContainText(/\d+\sbodů/);
    await expect(page.locator('#g-stars svg')).toHaveCount(3);
    await expect(page.locator('#g-reasons li').first()).toHaveClass(/\bon\b/);
    await expect(page.locator('#g-quests-title')).toContainText('1/4');
    await expect(page.locator('#g-quests-list li').nth(3)).toHaveClass(/\bon\b/);
    await expect(page.locator('#g-done')).toContainText('Hotovo, tvoje verze hry je dohraná!');
    await expect(page.locator('#g-done [data-go="vysledek"]')).toHaveText('Můj výsledek');
    expect((await widgetState(page)).hry).toMatchObject({ status: 'done', ownWon: true, winAttempt: 1, edits: 3 });
    await expect(page.locator('[data-gstep="3"]')).toHaveClass(/\bok\b/);
    expect(errors).toEqual([]);
  });
}

test('první výhra ukáže hvězdy a body a nabídne úpravu hry, trampolína přenese přes díru', async ({ page }) => {
  test.slow();
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = trackErrors(page);
  await open(page, '/index.html?ukazka=hry');
  const card = page.locator('#g-card');
  // skákání pořád dokola projde původní hrou při jakékoli rychlosti snímků:
  // skok z dopadu přenese přes díru i bug a poslední vede za cíl
  await page.locator('#g-play').click();
  await page.evaluate(() => new Promise<void>(done => {
    const root = document.querySelector('prace-na-zkousku')!.shadowRoot!;
    const timer = setInterval(() => {
      root.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, composed: true }));
      if ((root.querySelector('#g-play') as HTMLElement).hidden) return;
      clearInterval(timer);
      done();
    }, 50);
  }));
  await expect(card).toContainText('Jsi ve studiu!');
  await expect(card).toContainText(/\d+\sbodů/);
  await expect(page.locator('#g-status')).toContainText('Zkus to znovu na tři hvězdy');
  await expect(page.locator('#g-reasons')).toContainText('Bez ztráty života');
  // po první výhře se nabízí úprava, tlačítko svítí a do úprav se nejde samo
  await expect(page.locator('#g-tools')).toBeHidden();
  await expect(page.locator('#g-edit')).toHaveClass(/\bbtn-primary\b/);
  expect((await widgetState(page)).hry.status).not.toBe('done');

  await page.locator('#g-edit').click();
  await expect(card).toBeHidden();
  await page.locator('[data-tool="4"]').click();
  await tapCell(page, 3, 5);
  await expect(page.locator('#g-quests-list li').nth(2)).toHaveClass(/\bon\b/);
  await page.locator('[data-tool="0"]').click();
  await tapCell(page, 8, 5);
  await page.locator('#g-play').click();
  await expect(page.locator('#g-status')).toContainText('Tvoje verze hry je dohraná!', { timeout: 10_000 });
  expect((await widgetState(page)).hry).toMatchObject({ status: 'done', ownWon: true });
  expect(errors).toEqual([]);
});

test('nástroje mají ikonu a vysvětlení a Smazat je od ostatních oddělené', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=hry');
  for (let n = 1; n <= 3; n++) await dieOnce(page, n);
  const tools = page.locator('#g-tools .tool');
  await expect(tools).toHaveCount(5);
  await expect(tools.locator('svg')).toHaveCount(5);
  await expect(tools.locator('b')).toHaveText(['Přidej plošinu', 'Přidej bug', 'Přidej kód', 'Přidej trampolínu', 'Smazat']);
  await expect(tools.nth(1).locator('small')).toHaveText('Když se ho postava dotkne, přijde o život. Těžší hra, víc bodů.');
  await expect(tools.nth(2).locator('small')).toHaveText('Je to odměna, každý kousek je 100 bodů.');
  await expect(page.locator('[data-tool="1"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-tool="3"]').click();
  await expect(page.locator('[data-tool="3"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-tool="1"]')).toHaveAttribute('aria-pressed', 'false');

  const spring = (await page.locator('[data-tool="4"]').boundingBox())!;
  const erase = (await page.locator('[data-tool="0"]').boundingBox())!;
  const solid = (await page.locator('[data-tool="1"]').boundingBox())!;
  const bug = (await page.locator('[data-tool="2"]').boundingBox())!;
  expect(erase.x - (spring.x + spring.width), 'mezera před Smazat').toBeGreaterThan(bug.x - (solid.x + solid.width));

  // klepnutí mimo herní plochu nic nezmění
  const box = (await page.locator('#g-canvas').boundingBox())!;
  await page.mouse.click(box.x + 10, box.y + box.height / 2);
  expect((await widgetState(page)).hry.edits).toBe(0);
});

test('Hrát pulzuje do prvního spuštění a hru spustí i klepnutí do ní', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await open(page, '/index.html?ukazka=hry');
  const play = page.locator('#g-play');
  await expect(play).toHaveClass(/\bpulse\b/);
  expect(await play.evaluate(b => getComputedStyle(b).animationName)).toBe('pulse');
  await page.locator('#g-canvas').click();
  await expect(page.locator('#g-jump')).toBeVisible();
  expect((await widgetState(page)).hry.plays).toBe(1);
  await expect.poll(async () => (await widgetState(page)).hry.deaths, { timeout: 10_000 }).toBe(1);
  await expect(play).toBeVisible();
  await expect(play).not.toHaveClass(/\bpulse\b/);
});

test('bez animací má Hrát místo pulzování stálý žlutý kruh', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=hry');
  const play = page.locator('#g-play');
  await expect(play).toHaveClass(/\bpulse\b/);
  const css = await play.evaluate(b => ({ anim: getComputedStyle(b).animationName, shadow: getComputedStyle(b).boxShadow }));
  expect(css.anim).toBe('none');
  expect(css.shadow).toContain('rgba(250, 186, 32, 0.45)');
});

test('mezerník skáče jen s fokusem ve widgetu', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await open(page, '/index.html?ukazka=hry');
  await page.locator('#g-play').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#g-jump')).toBeVisible();
  const f = await page.evaluate(() => document.querySelector('prace-na-zkousku')!.shadowRoot!.activeElement?.id);
  expect(f, 'po schování Hrát přejde fokus na Skok').toBe('g-jump');
});

test('přeskočená hra není hotová, výsledek je dostupný (rozhodnutí 7)', async ({ page }) => {
  test.slow();
  await page.setViewportSize(MOBILE);
  await open(page, '/index.html?ukazka=hry');
  for (let n = 1; n <= 6; n++) await dieOnce(page, n);
  const skip = page.locator('#g-skip');
  await expect(skip).toBeVisible();
  await skip.click();
  await expect(page.locator('#v-vysledek')).toBeVisible();
  await expect(page.locator('#r-reco h2')).toHaveText('Tvorba her');
  await expect(page.locator('.prog')).toBeVisible();
  expect((await widgetState(page)).hry.status).toBe('skipped');

  await page.locator('.logo').click();
  await expect(page.locator('[data-state="hry"]')).toHaveText('Přeskočeno');
  await page.locator('.path-card[data-go="data"]').click();
  await expect(page.locator('#v-data [data-more] [data-go="hry"]')).toContainText('Přeskočeno');
  await page.locator('#v-data [data-more] [data-go="hry"]').click();
  await expect(page.locator('#g-done')).toBeHidden();
});
