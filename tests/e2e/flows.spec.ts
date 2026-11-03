/* Přepis referenčního check7.py: celé toky Datová analýza, Stavění s AI
   a Kyberbezpečnost na samostatné stránce, okno s odznakem, výsledek a ceny.
   Navigace klikáním a přes ?ukazka, ne přes hash. Panel obchodníka widget
   nemá, co by dorazilo do Pipedrivu, se ověřuje ve stavu widgetu. */
import { expect, test } from '@playwright/test';
import { LAPTOP, MOBILE, NBSP, focused, open, solveData, trackErrors, widgetState } from './helpers.ts';

test('A: Datová analýza na mobilu, okno s odznakem, výsledek a školení přes firmu', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  const errors = trackErrors(page);
  await open(page, '/index.html');
  await page.locator('.path-card[data-go="data"]').click();
  await expect(page.locator('#v-data')).toBeVisible();

  // nástroj nesbírá kontakt
  await expect(page.locator('form, input[type="email"], input[type="tel"], #gate')).toHaveCount(0);
  await expect(page.locator('#d-done')).toBeHidden();

  for (const tab of await page.locator('[data-dview]').all()) await tab.click();
  await expect(page.locator('#d-seen')).toHaveText('Prohlédnuto 4 ze 4 pohledů na data');

  const opts = page.locator('#d-options .opt');
  await opts.nth(0).click();
  await expect(page.locator('#d-feedback')).toContainText('Káva v březnu vydělala skoro stejně jako v únoru');
  await expect(opts.nth(0)).toBeDisabled();
  await opts.nth(2).click();
  await expect(page.locator('#d-done')).toBeVisible();
  await expect(page.locator('#d-fab')).toBeHidden();
  await expect(page.locator('#d-sql-box')).toBeVisible();

  await page.locator('[data-claim="data"]').click();
  await expect(page.locator('#cel')).toBeVisible();
  await expect(page.locator('#cel-title')).toHaveText('Detektivka vyřešená');
  await expect(page.locator('#cel-count')).toHaveText('Máš 1 ze 4 odznaků. Výsledek už na tebe čeká.');
  expect((await focused(page)).text).toBe('Můj výsledek');
  const seen = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const f = await focused(page);
    expect(f.inDialog, 'fokus musí zůstat v okně').toBe(true);
    seen.add(f.text ?? '');
  }
  expect([...seen].sort()).toEqual(['Další práce', 'Můj výsledek', 'Zůstat tady']);

  await page.keyboard.press('Escape');
  await expect(page.locator('#cel')).toBeHidden();
  await expect(page.locator('#d-done [data-claim]')).toBeHidden();
  await expect(page.locator('#d-done [data-go="vysledek"]')).toBeVisible();
  // fokus se vrátí na první z tlačítek, která nahradila „Vyzvednout odznak“
  expect(await focused(page)).toMatchObject({ text: 'Zkusit další práci', go: 'start' });

  await page.locator('#d-done [data-go="vysledek"]').click();
  await expect(page.locator('#r-reco h2')).toHaveText('Datová analýza');
  await expect(page.locator('#r-reco .tagline')).toHaveText('Tvoje první práce na zkoušku');
  await expect(page.locator('#r-reco .why')).toContainText('Detektivka vyřešená na 2. pokus');
  const price = page.locator('#r-price');
  await expect(price).toContainText('29 000 Kč');
  await expect(price).toContainText('Dotace 35 000 Kč');
  await expect(price).toContainText('Běžná cena kurzu 64 000 Kč. Z toho 35 000 Kč zaplatí úřad práce.');
  expect(await page.locator('#r-price .pbig').textContent()).toBe('29' + NBSP + '000' + NBSP + 'Kč');
  await expect(page.locator('label:has(#r-lowinc)')).toBeHidden();
  await expect(page.locator('#r-next a').first()).toHaveText('Data Analyst Mini zdarma');

  // na mobilu pod sebou: doporučení, cena, Co dál, další práce (i v pořadí DOM, S8)
  const tops = [];
  for (const sel of ['#r-reco', '#r-price-box', '#r-next-box', '#r-others-box']) tops.push((await page.locator(sel).boundingBox())!.y);
  expect(tops).toEqual([...tops].sort((a, b) => a - b));

  await page.locator('[data-goal="upskill"]').click();
  await expect(page.locator('.firm')).toBeVisible();
  await expect(page.locator('#r-reco .desc')).toContainText('Naučíš se rychle zpracovat data');
  await page.locator('#r-firm').check();
  const st = await widgetState(page);
  expect(st).toMatchObject({ goal: 'upskill', firm: true, lowIncome: null });
  expect(st.data).toMatchObject({ status: 'done', tries: 2, firstTry: false, revealed: false });

  await page.locator('[data-goal="switch"]').click();
  await expect(page.locator('.firm')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('A2: tři chyby v Datové analýze ukážou správnou odpověď', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/index.html?ukazka=data');
  const opts = page.locator('#d-options .opt');
  for (const i of [0, 1, 3]) await opts.nth(i).click();
  await expect(opts.nth(2)).toHaveClass(/\bok\b/);
  await expect(page.locator('#d-feedback')).toContainText('Správně je zmizení víkendových snídaní');
  await expect(page.locator('#d-done')).toBeVisible();
  expect((await widgetState(page)).data).toMatchObject({ status: 'done', tries: 3, revealed: true });
  await page.locator('[data-claim="data"]').click();
  await page.locator('#cel [data-go="vysledek"]').click();
  await expect(page.locator('#r-reco .why')).toContainText('Správnou odpověď ukázal nástroj');
});

test('B: Stavění s AI, odznak až po první úpravě, nízkopříjmová skupina', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  const errors = trackErrors(page);
  await open(page, '/index.html?ukazka=ai');
  await page.locator('[data-idea="uctenka"]').click();
  await expect(page.locator('#a-changes-wrap')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#a-app')).toContainText('Každý platí 460 Kč');
  await expect(page.locator('#a-done')).toBeHidden();
  await expect(page.locator('#a-own, #a-changes input')).toHaveCount(0);

  await page.locator('#a-changes .btn').first().click();
  await expect(page.locator('#a-done')).toBeVisible();
  await expect(page.locator('#a-app [data-tip]')).toHaveCount(3);
  await page.locator('[data-claim="ai"]').click();
  await expect(page.locator('#cel-title')).toHaveText('Aplikace postavená');
  await page.locator('#cel-close').click();
  await expect(page.locator('#cel')).toBeHidden();
  expect((await focused(page)).text).toBe('Zkusit další práci');

  await page.locator('#a-done [data-go="vysledek"]').click();
  await expect(page.locator('#r-reco h2')).toHaveText('Stavění aplikací s AI');
  await expect(page.locator('#r-reco .why')).toContainText('Aplikace „Dělení útraty“ postavená');
  await expect(page.locator('label:has(#r-lowinc)')).toBeVisible();
  await expect(page.locator('#r-lowinc')).toBeVisible();
  const price = page.locator('#r-price');
  await expect(price).toContainText('5 795 Kč');
  await expect(price).toContainText('Dotace 19 105 Kč');
  expect((await widgetState(page)).lowIncome).toBe(false);
  await page.locator('#r-lowinc').check();
  await expect(price).toContainText('0 Kč');
  await expect(price).toContainText('Dotace 24 900 Kč');
  await expect(price).toContainText('Celou cenu může zaplatit úřad práce.');
  expect((await widgetState(page)).lowIncome).toBe(true);
  expect(errors).toEqual([]);
});

test('B2: nové postavení aplikace začíná od nuly (A14)', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=ai');
  await page.locator('[data-idea="uctenka"]').click();
  await page.locator('#a-changes .btn', { hasText: 'Přidej spropitné' }).click();
  await page.locator('#a-app [data-tip="10"]').click();
  await expect(page.locator('#a-app')).toContainText('včetně spropitného 10');
  await page.locator('[data-idea="uctenka"]').click();
  await expect(page.locator('#a-app')).toContainText('Každý platí 460 Kč');
  await expect(page.locator('#a-app [data-tip]')).toHaveCount(0);
  await expect(page.locator('#a-changes .btn:enabled')).toHaveCount(3);
});

test('C: Kyberbezpečnost na notebooku a rozložení výsledku', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  const errors = trackErrors(page);
  await open(page, '/index.html?ukazka=kyber');
  await page.locator('[data-cmd="grep"]').click();
  await page.locator('[data-cmd="count"]').click();
  await page.locator('[data-q1="1"]').click();
  await expect(page.locator('#s-fb')).toHaveText('Tři pokusy jsou nejspíš někdo z kanceláře, kdo si spletl heslo.');
  await page.locator('[data-q1="0"]').click();
  await page.locator('[data-cmd="ufw"]').click();
  await expect(page.locator('#s-out div').last()).toHaveText('Rule inserted');
  await page.locator('[data-cmd="last"]').click();
  await page.locator('[data-q2="1"]').click();
  await page.locator('#s-k1').check();
  await page.locator('#s-k3').check();
  await page.locator('[data-act="deploy"]').click();
  await expect(page.locator('#s-fb')).toContainText('Vypínat server nejde');
  await page.locator('#s-k3').uncheck();
  await page.locator('#s-k2').check();
  await page.locator('[data-act="deploy"]').click();
  await expect(page.locator('#s-done')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#s-panel .why')).toContainText('Správná rozhodnutí napoprvé: 1 ze 3');
  expect((await widgetState(page)).kyber).toMatchObject({ status: 'done', firstOk: 1, mistakes: 2 });

  await page.locator('[data-claim="kyber"]').click();
  await expect(page.locator('#cel-title')).toHaveText('Server ubráněný');
  await page.locator('#cel-close').click();
  await page.locator('#s-done [data-go="vysledek"]').click();
  await expect(page.locator('#r-reco h2')).toHaveText('Kyberbezpečnost');
  const reco = (await page.locator('#r-reco').boundingBox())!;
  const priceBox = (await page.locator('#r-price-box').boundingBox())!;
  expect(priceBox.x).toBeGreaterThan(reco.x + reco.width - 1);
  const why = page.locator('#r-reco .why li');
  await expect(why).toHaveText(['Útok zastavený a napadený účet zamčený', 'Správná rozhodnutí napoprvé: 1 ze 3']);
  expect(errors).toEqual([]);
});

test('C2: dvě hotové ukázky, otázka co bavilo nejvíc a Spíš ne jen u své ukázky', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=data');
  await solveData(page);
  await page.locator('[data-claim="data"]').click();
  await page.locator('#cel [data-go="vysledek"]').click();
  await page.locator('[data-fav="not:data"]').click();
  await expect(page.locator('#r-reco .tagline')).toHaveText('Zatím ti nejvíc sedí');
  await expect(page.locator('#r-reco [data-fav="not:data"]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#r-others [data-go="ai"]').click();
  await page.locator('[data-idea="navyky"]').click();
  await page.locator('#a-changes .btn').first().click();
  await page.locator('[data-claim="ai"]').click();
  await page.locator('#cel [data-go="vysledek"]').click();
  // „Spíš ne“ dál patří Datové analýze, která vychází jako doporučení (T6, Z10)
  await expect(page.locator('#r-reco h2')).toHaveText('Datová analýza');
  await expect(page.locator('#r-reco .tagline')).toHaveText('Zatím ti nejvíc sedí');
  await expect(page.locator('#r-reco .fav button')).toHaveText(['Datová analýza', 'Stavění aplikací s AI', 'Nevím']);
  await page.locator('[data-fav="ai"]').click();
  await expect(page.locator('#r-reco h2')).toHaveText('Stavění aplikací s AI');
  await expect(page.locator('#r-reco .tagline')).toHaveText('Tvůj nejsilnější směr');
  await expect(page.locator('#r-reco .why')).toContainText('Bavilo tě to ze všeho nejvíc');
  expect((await focused(page)).text).toBe('Stavění aplikací s AI');
  await expect(page.locator('#prog-text')).toHaveText('Odznaky 2/4');
});
