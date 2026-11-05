/* Celé toky na samostatné stránce: Datová analýza po krocích, Kyberbezpečnost,
   schované Stavění s AI, další příklady, výsledek v jednom sloupci a ceny.
   Navigace klikáním a přes ?ukazka, ne přes hash. Panel obchodníka widget nemá,
   co by dorazilo do Pipedrivu, se ověřuje ve stavu widgetu. */
import { expect, test } from '@playwright/test';
import { LAPTOP, MOBILE, NBSP, focused, open, openWithAi, solveData, solveKyber, trackErrors, widgetState } from './helpers.ts';

test('A: Datová analýza na mobilu po krocích a výsledek v jednom sloupci', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  const errors = trackErrors(page);
  await open(page, '/index.html');
  await page.locator('.path-card[data-go="data"]').click();
  await expect(page.locator('#v-data')).toBeVisible();

  // nástroj nesbírá kontakt
  await expect(page.locator('form, input[type="email"], input[type="tel"], #gate')).toHaveCount(0);
  await expect(page.locator('#d-done')).toBeHidden();
  await expect(page.locator('#v-data .mission')).toContainText('Najdi, proč poklesly tržby.');

  // krok 1: špatná odpověď zmizí a napoví, správná pustí dál
  await expect(page.locator('#d-step .step-no')).toContainText('Porovnej měsíce');
  await expect(page.locator('#d-step .of')).toHaveText('krok 1 ze 3');
  await expect(page.locator('#d-step .bar-row')).toHaveCount(4);
  const opts = page.locator('#d-options .opt');
  await expect(opts).toHaveText(['Leden', 'Únor', 'Březen', 'Duben']);
  await opts.nth(0).click();
  await expect(page.locator('#d-fb')).toContainText('Hledej nejkratší pruh.');
  await expect(opts.nth(0)).toBeDisabled();
  await expect(page.locator('#d-next')).toBeHidden();
  await opts.nth(2).click();
  await expect(page.locator('#d-fb')).toContainText('o 57 600 Kč méně než v únoru');
  await expect(page.locator('#d-fb')).toHaveClass(/\bok\b/);
  await expect(page.locator('#d-next')).toBeInViewport();

  // krok 2: dvě řady pruhů, u každého jeho částka, bez rozdílu proti únoru
  await page.locator('#d-next').click();
  await expect(page.locator('#d-step .step-no')).toContainText('Podívej se, co lidé kupovali');
  expect((await focused(page)).id, 'fokus na nadpisu nového kroku').toBe('d-step-title');
  await expect(page.locator('#d-step .bar-row.pair')).toHaveCount(4);
  await expect(page.locator('#d-step .legend')).toHaveText('únorbřezen');
  await expect(page.locator('#d-step .bar-row.pair').nth(2)).toContainText('62 100 Kč');
  await expect(page.locator('#d-step .bar-row.pair').nth(2)).toContainText('9 300 Kč');
  await opts.nth(2).click();
  await expect(page.locator('#d-fb')).toContainText('Snídaně spadly z 62 100 na 9 300 Kč');

  // krok 3: správná odpověď rovnou ukáže výsledek ukázky
  await page.locator('#d-next').click();
  await expect(page.locator('#d-step .step-no')).toContainText('Podívej se na dny v týdnu');
  await expect(page.locator('#d-step .bar-row.pair')).toHaveCount(7);
  await expect(page.locator('.prog')).toBeHidden();
  await opts.nth(1).click();
  await expect(page.locator('#d-end')).toContainText('Zmizely víkendové snídaně');
  await expect(page.locator('#d-step')).toContainText('Stálo ji to 52 800 Kč za měsíc.');
  await expect(page.locator('#d-sql-box')).toBeVisible();
  await expect(page.locator('#d-done')).toContainText('Hotovo, víš, proč tržby klesly!');
  await expect(page.locator('.prog')).toHaveText('Můj výsledek');
  expect((await widgetState(page)).data).toMatchObject({ status: 'done', mistakes: 1, firstTry: false, revealed: false });

  await page.locator('#d-done [data-go="vysledek"]').click();
  await expect(page.locator('#r-reco h2')).toHaveText('Datová analýza');
  await expect(page.locator('#r-reco .tagline')).toHaveText('Tvoje první práce na zkoušku');
  const price = page.locator('#r-price');
  await expect(price).toContainText('29 000 Kč');
  await expect(price).toContainText('Dotace 35 000 Kč');
  await expect(price).toContainText('Běžná cena kurzu 64 000 Kč. Z toho 35 000 Kč zaplatí úřad práce.');
  expect(await page.locator('#r-price .pbig').textContent()).toBe('29' + NBSP + '000' + NBSP + 'Kč');
  await expect(page.locator('label:has(#r-lowinc)')).toBeHidden();
  await expect(page.locator('#r-next a').first()).toHaveText('Data Analyst Mini zdarma');

  // u odkazů je jasné, že výsledek zůstane, a opravdu se otevřou v nové záložce
  await expect(page.locator('#r-new-tab')).toHaveText('Odkazy se otevřou v nové záložce, tvůj výsledek tady zůstane.');
  for (const a of await page.locator('#r-next a').all()) await expect(a).toHaveAttribute('target', '_blank');

  // jeden sloupec a v tomto pořadí i v DOM (S8)
  const boxes = [];
  for (const sel of ['#r-reco', '#r-price-box', '#r-next-box', '#r-others-box']) boxes.push((await page.locator(sel).boundingBox())!);
  expect(boxes.map(b => b.y)).toEqual(boxes.map(b => b.y).sort((a, b) => a - b));
  expect(new Set(boxes.map(b => Math.round(b.x))).size).toBe(1);

  // co vypadlo ze schůzky 4. 11.
  await expect(page.locator('#v-vysledek .why, [data-fav], [data-goal], .firm, .badge, dialog')).toHaveCount(0);
  const st = await widgetState(page);
  expect(st).toMatchObject({ fav: null, goal: null, firm: false, lowIncome: null });
  expect(errors).toEqual([]);
});

test('A2: po dvou špatných odpovědích v kroku se ukáže správná, i v posledním', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=data');
  const opts = page.locator('#d-options .opt');
  await opts.nth(0).click();
  await opts.nth(1).click();
  await expect(opts.nth(2)).toHaveClass(/\bok\b/);
  await expect(page.locator('#d-fb')).toHaveText('Správná odpověď je označená zeleně.');
  for (const o of await opts.all()) await expect(o).toBeDisabled();
  await page.locator('#d-next').click();
  await opts.nth(2).click();
  await page.locator('#d-next').click();

  // ve třetím kroku po dvou špatných zůstane vidět správná a dál jde tlačítkem
  await opts.nth(0).click();
  await expect(page.locator('#d-fb')).toContainText('Podívej se na sobotu a neděli.');
  await opts.nth(2).click();
  await expect(opts.nth(1)).toHaveClass(/\bok\b/);
  await expect(page.locator('#d-done')).toBeHidden();
  await page.locator('#d-next').click();
  await expect(page.locator('#d-end')).toBeVisible();
  await expect(page.locator('#d-done')).toBeVisible();
  expect((await widgetState(page)).data).toMatchObject({ status: 'done', mistakes: 4, revealed: true, firstTry: false });
});

test('A3: projití bez chyby je napoprvé', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/index.html?ukazka=data');
  await solveData(page);
  expect((await widgetState(page)).data).toMatchObject({ status: 'done', mistakes: 0, revealed: false, firstTry: true });
});

test('Stavění s AI se nikde nenabízí, ale kód jde zapnout atributem', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/index.html?ukazka=ai');
  await expect(page.locator('#v-start')).toBeVisible();
  await expect(page.locator('#v-ai')).toHaveCount(0);
  await expect(page.locator('.path-card')).toHaveCount(3);
  await expect(page.locator('[data-go="ai"]')).toHaveCount(0);
  await page.locator('.path-card[data-go="kyber"]').click();
  await expect(page.locator('#v-kyber [data-more] .other')).toHaveCount(2);
  await expect(page.locator('[data-go="ai"]')).toHaveCount(0);

  await page.unrouteAll();
  await openWithAi(page, '/index.html');
  await expect(page.locator('.path-card')).toHaveCount(4);
  await expect(page.locator('#v-ai')).toHaveCount(1);
});

test('B: Stavění s AI, chyba k odhalení, hotovo až po první úpravě, nízkopříjmová skupina', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  const errors = trackErrors(page);
  await openWithAi(page, '/index.html?ukazka=ai');
  await page.locator('[data-idea="uctenka"]').click();
  await expect(page.locator('#a-bug-wrap')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#a-app')).toContainText('Každý platí 613,3333333333334 Kč');
  await expect(page.locator('#a-changes-wrap')).toBeHidden();
  await expect(page.locator('#a-fix-row')).toBeHidden();
  await expect(page.locator('#a-own, #a-changes input')).toHaveCount(0);

  // špatná odpověď zmizí, správná ukáže tlačítko opravy
  await page.locator('#a-bug .opt').nth(2).click();
  await expect(page.locator('#a-bug .opt').nth(2)).toBeDisabled();
  await expect(page.locator('#a-bug-fb')).toHaveClass(/\bno\b/);
  await expect(page.locator('#a-fix-row')).toBeHidden();
  await page.locator('#a-bug .opt').nth(0).click();
  await expect(page.locator('#a-bug-fb')).toContainText('Přesně tak.');
  await expect(page.locator('#a-fix')).toHaveText('Zaokrouhli částku nahoru na desetikoruny');
  await page.locator('#a-fix').click();
  await expect(page.locator('#a-changes-wrap')).toBeVisible();
  await expect(page.locator('#a-app')).toContainText('Každý platí 620 Kč');
  await expect(page.locator('#a-fix-row')).toBeHidden();
  await expect(page.locator('#a-done')).toBeHidden();
  expect((await widgetState(page)).ai.status).not.toBe('done');

  await page.locator('#a-changes .btn', { hasText: 'Rozpočítej podle toho, kdo co měl' }).click();
  await expect(page.locator('#a-done')).toBeVisible();
  // každý platí svoje a třetinu společného, zaokrouhleno nahoru na desetikoruny
  await expect(page.locator('#ap-out li')).toHaveText([`Petr590${NBSP}Kč`, `Jana530${NBSP}Kč`, `Ty720${NBSP}Kč`]);
  await expect(page.locator('#ap-sum')).toHaveCount(0);

  await page.locator('#a-done [data-go="vysledek"]').click();
  await expect(page.locator('#r-reco h2')).toHaveText('Stavění aplikací s AI');
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
  await openWithAi(page, '/index.html?ukazka=ai');
  await page.locator('[data-idea="uctenka"]').click();
  await page.locator('#a-bug .opt').first().click();
  await page.locator('#a-fix').click();
  await page.locator('#a-changes .btn', { hasText: 'Přidej spropitné' }).click();
  await page.locator('#a-app [data-tip="10"]').click();
  await expect(page.locator('#a-app')).toContainText('včetně spropitného 10');
  await page.locator('[data-idea="uctenka"]').click();
  // nová aplikace má zase chybu, žádné spropitné a úpravy čekají až na opravu
  await expect(page.locator('#a-bug-wrap')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#a-app')).toContainText('Každý platí 613,3333333333334 Kč');
  await expect(page.locator('#a-app [data-tip]')).toHaveCount(0);
  await expect(page.locator('#a-bug .opt:enabled')).toHaveCount(3);
  await expect(page.locator('#a-changes-wrap')).toBeHidden();
  await page.locator('#a-bug .opt').first().click();
  await page.locator('#a-fix').click();
  await expect(page.locator('#a-changes .btn:enabled')).toHaveCount(3);
});

test('B3: chyba v rezervaci a v návycích, po dvou špatných odpovědích se ukáže správná', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = trackErrors(page);
  await openWithAi(page, '/index.html?ukazka=ai');

  // rezervace před opravou nabízí obsazený čas a potvrdí ho
  await page.locator('[data-idea="kadernice"]').click();
  await expect(page.locator('#a-bug-ctx')).toContainText(`obsazeno v${NBSP}9:00 a${NBSP}16:00`);
  await page.locator('#a-app [data-time="9:00"]').click();
  await page.locator('#ap-book').click();
  await expect(page.locator('#ap-conf')).toContainText('Rezervace potvrzená');
  await page.locator('#a-bug .opt').nth(1).click();
  await expect(page.locator('#a-fix-row')).toBeHidden();
  await page.locator('#a-bug .opt').nth(2).click();
  await expect(page.locator('#a-bug .opt').nth(0)).toHaveClass(/\bok\b/);
  await expect(page.locator('#a-bug-fb')).toContainText('Chyba je označená zeleně.');
  await page.locator('#a-fix').click();
  await expect(page.locator('#a-app [data-time="9:00"]')).toBeDisabled();
  await expect(page.locator('#a-app [data-time="16:00"]')).toBeDisabled();
  await page.locator('#a-changes .btn', { hasText: 'Posílej potvrzení SMS' }).click();
  await expect(page.locator('#a-app .app-sms')).toContainText('Po rezervaci sem přijde potvrzení SMS.');
  await page.locator('#a-app [data-time="13:00"]').click();
  await page.locator('#ap-book').click();
  await expect(page.locator('#a-app .app-sms')).toContainText('potvrzujeme termín');

  // návyky před opravou začínají nedělí, po opravě pondělím a graf má řádek za každý návyk
  await page.locator('[data-idea="navyky"]').click();
  await expect(page.locator('#a-bug-wrap')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#a-app .hd').first()).toHaveText('Ne');
  await page.locator('#a-bug .opt').first().click();
  await page.locator('#a-fix').click();
  await expect(page.locator('#a-app .hd').first()).toHaveText('Po');
  await expect(page.locator('#a-app .hd').last()).toHaveText('Ne');
  await page.locator('#a-changes .btn', { hasText: 'Přidej graf pokroku' }).click();
  await expect(page.locator('#a-app .hbar')).toHaveCount(3);
  await expect(page.locator('#a-app .hbar').first()).toContainText(`5 z${NBSP}7`);
  expect((await widgetState(page)).ai.status).toBe('done');
  expect(errors).toEqual([]);
});

test('C: Kyberbezpečnost na notebooku v jednom sloupci a terminál bokem', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  const errors = trackErrors(page);
  await open(page, '/index.html?ukazka=kyber');

  // poplach přímo navazuje na akce a terminál je vpravo vedle nich
  const alert = (await page.locator('#v-kyber .alert').boundingBox())!;
  const panel = (await page.locator('#s-panel').boundingBox())!;
  const term = (await page.locator('#v-kyber .term').boundingBox())!;
  expect(panel.y - (alert.y + alert.height)).toBeLessThanOrEqual(12);
  expect(Math.round(panel.x)).toBe(Math.round(alert.x));
  expect(term.x).toBeGreaterThan(panel.x + panel.width - 1);

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
  await expect(page.locator('#s-panel')).toContainText('Server je v bezpečí');
  expect((await widgetState(page)).kyber).toMatchObject({ status: 'done', firstOk: 1, mistakes: 2 });

  // po vyřešení tlačítko k výsledku v levém sloupci, hned pod textem
  const p2 = (await page.locator('#s-panel').boundingBox())!;
  const go = (await page.locator('#s-done [data-go="vysledek"]').boundingBox())!;
  expect(go.y).toBeGreaterThanOrEqual(p2.y + p2.height);
  expect(go.y - (p2.y + p2.height)).toBeLessThanOrEqual(24);
  expect(go.x).toBeLessThan(p2.x + p2.width);
  await expect(page.locator('#s-done p')).toHaveCount(0);

  await page.locator('#s-done [data-go="vysledek"]').click();
  await expect(page.locator('#r-reco h2')).toHaveText('Kyberbezpečnost');
  const reco = (await page.locator('#r-reco').boundingBox())!;
  const priceBox = (await page.locator('#r-price-box').boundingBox())!;
  expect(priceBox.y).toBeGreaterThan(reco.y + reco.height - 1);
  expect(Math.round(priceBox.x)).toBe(Math.round(reco.x));
  expect(errors).toEqual([]);
});

test('C1: na mobilu je terminál pod krokem', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await open(page, '/index.html?ukazka=kyber');
  const panel = (await page.locator('#s-panel').boundingBox())!;
  const term = (await page.locator('#v-kyber .term').boundingBox())!;
  expect(term.y).toBeGreaterThanOrEqual(panel.y + panel.height);
});

test('C2: Zkus si další příklady, hotové odškrtnuté, a výsledek ze dvou ukázek', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=data');
  await expect(page.locator('.prog')).toBeHidden();
  await expect(page.locator('#v-data .back')).toHaveCount(0);
  const more = page.locator('#v-data [data-more] .other');
  await expect(more).toHaveCount(2);
  await expect(more.nth(0)).toContainText('Tvorba her');
  await expect(more.nth(0)).toContainText('Zahraj si hru a uprav ji');
  await expect(more.nth(0)).toContainText('asi 5 minut');
  await expect(more.nth(1)).toContainText('Kyberbezpečnost');

  await solveData(page);
  await page.locator('#v-data [data-go="kyber"]').click();
  await expect(page.locator('#v-kyber')).toBeVisible();
  expect((await focused(page)).text).toBe('Někdo se dobývá do serveru pekárny');
  const fromKyber = page.locator('#v-kyber [data-more] .other[data-go="data"]');
  await expect(fromKyber).toContainText('Hotovo ✓');
  await solveKyber(page);

  // dvě hotové: doporučení s bonusem za vstup, ostatní odškrtnuté
  await page.locator('.prog').click();
  await expect(page.locator('#r-reco h2')).toHaveText('Datová analýza');
  await expect(page.locator('#r-reco .tagline')).toHaveText('Tvůj nejsilnější směr');
  await expect(page.locator('#r-others [data-go="kyber"]')).toContainText('Hotovo ✓');
  await expect(page.locator('#r-others [data-go="hry"]')).toContainText('asi 5 minut');
  await expect(page.locator('#r-others [data-go="data"]')).toHaveCount(0);

  // na úvodu jsou hotové odškrtnuté a pruh s odznaky je pryč
  await page.locator('.logo').click();
  await expect(page.locator('[data-state="data"]')).toHaveText('Hotovo ✓');
  await expect(page.locator('[data-state="kyber"]')).toHaveText('Hotovo ✓');
  await expect(page.locator('[data-state="hry"]')).toHaveText('Zkusit');
  await expect(page.locator('#start-badges, .badges, .minis')).toHaveCount(0);
});
