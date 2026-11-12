/* Celé toky na samostatné stránce: Datová analýza po krocích, Kyberbezpečnost,
   schované Stavění s AI, další příklady, výsledek v jednom sloupci a ceny.
   Navigace klikáním a přes ?ukazka, ne přes hash. Panel obchodníka widget nemá,
   co by dorazilo do Pipedrivu, se ověřuje ve stavu widgetu. */
import { expect, test } from '@playwright/test';
import { LAPTOP, MOBILE, NBSP, dataBar, dataOpt, focused, open, openWithAi, solveData, solveKyber, trackErrors, widgetState } from './helpers.ts';

test('A: Datová analýza na mobilu po krocích a výsledek v jednom sloupci', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  const errors = trackErrors(page);
  await open(page, '/index.html');
  await page.locator('.path-card[data-go="data"]').click();
  await expect(page.locator('#v-data')).toBeVisible();

  // nástroj nesbírá kontakt
  await expect(page.locator('form, input[type="email"], input[type="tel"], #gate')).toHaveCount(0);
  await expect(page.locator('#d-done')).toBeHidden();

  // Jana přijde s problémem, špatná volba zmizí a Jana k ní řekne svoje
  const stage = page.locator('#d-step');
  await expect(page.locator('#d-jana')).toContainText('Nemrkneš na to?');
  await expect(stage).toHaveAttribute('data-scene', 'jana');
  const opts = page.locator('#d-options .act');
  await expect(opts).toHaveCount(3);
  await opts.nth(0).click();
  await expect(page.locator('#d-fb')).toContainText('Vždyť ještě nevíme');
  await expect(opts.nth(0)).toBeDisabled();
  await expect(stage).toHaveAttribute('data-scene', 'jana');

  // stažení dat: jeviště ztmavne a naskočí počet účtenek
  await opts.nth(1).click();
  await expect(stage).toHaveAttribute('data-scene', 'raw');
  await expect(page.locator('#d-count')).toHaveText('9 660 účtenek');
  await opts.nth(2).click();

  // měsíce: kliká se přímo na sloupec, špatný zmizí a správný odhalí první stopu
  await expect(stage).toHaveAttribute('data-scene', 'chart');
  const bars = page.locator('#d-chart [data-bar]');
  await expect(bars).toHaveCount(4);
  await expect(bars.nth(2)).toContainText('241 300 Kč');
  await bars.nth(0).click();
  await expect(page.locator('#d-fb')).toContainText('Hledej nejnižší sloupec.');
  await expect(bars.nth(0)).toBeDisabled();
  await bars.nth(2).click();
  await expect(page.locator('#d-found')).toContainText('o 57 600 Kč níž než únor');
  await expect(page.locator('.clue').nth(0)).toContainText('v březnu');
  await expect(page.locator('#d-fb')).toBeHidden();
  expect((await focused(page)).id, 'fokus na další otázce').toBe('d-q');

  // dny: sloupce po dvojicích, stačí kliknout na jeden z víkendových
  await opts.nth(0).click();
  await expect(bars).toHaveCount(7);
  await expect(page.locator('#d-step .legend')).toHaveText('únorbřezen');
  await bars.nth(6).click();
  await expect(bars.nth(5)).toHaveClass(/\bhit\b/);
  await expect(page.locator('.clue').nth(1)).toContainText('o víkendu');

  // produkty: vodorovné pruhy s částkami
  await opts.nth(1).click();
  await expect(bars).toHaveCount(4);
  await expect(bars.nth(2)).toContainText('62 100 Kč');
  await expect(bars.nth(2)).toContainText('9 300 Kč');
  await expect(page.locator('.prog')).toBeHidden();
  await bars.nth(2).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#d-found')).toContainText('Snídaně spadly z 62 100 na 9 300 Kč');
  await expect(page.locator('.clue').nth(2)).toContainText('snídaně');

  // závěr: zpráva Janě, její odpověď a výsledek ukázky
  await opts.nth(2).click();
  await expect(stage).toHaveAttribute('data-scene', 'solved');
  await expect(page.locator('#d-end')).toContainText('Zmizely víkendové snídaně');
  await expect(stage).toContainText('odešel kuchař');
  await expect(page.locator('#d-lost')).toHaveText('52 800 Kč');
  await expect(page.locator('#d-sql-box')).toBeVisible();
  await expect(page.locator('#d-done')).toContainText('Hotovo, víš, proč tržby klesly!');
  await expect(page.locator('.prog')).toHaveText('Můj výsledek');
  expect((await widgetState(page)).data).toMatchObject({ status: 'done', mistakes: 2, firstTry: false, revealed: false });

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

test('A2: po dvou špatných volbách se rozsvítí správná, u tlačítek i v grafu', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=data');
  const opts = page.locator('#d-options .act');
  const bars = page.locator('#d-chart [data-bar]');
  await opts.nth(0).click();
  await opts.nth(2).click();
  await expect(opts.nth(1)).toHaveClass(/\blit\b/);
  await expect(page.locator('#d-fb')).toContainText('Správná odpověď svítí.');
  await opts.nth(1).click();
  await opts.nth(2).click();

  // v grafu se po dvou špatných vypnou všechny ostatní sloupce
  await bars.nth(0).click();
  await bars.nth(1).click();
  await expect(bars.nth(2)).toHaveClass(/\blit\b/);
  await expect(bars.nth(3)).toBeDisabled();
  await expect(page.locator('#d-fb')).toContainText('Správná odpověď svítí.');
  await expect(page.locator('#d-done')).toBeHidden();
  await bars.nth(2).click();
  await expect(page.locator('#d-found')).toBeVisible();

  for (const [move, n] of [[dataOpt, 0], [dataBar, 5], [dataOpt, 1], [dataBar, 2], [dataOpt, 2]] as const) await move(page, n);
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

test('C: IT administrátor na notebooku: úvod, krok po kroku, chyby a výsledková karta', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = trackErrors(page);
  await open(page, '/index.html?ukazka=kyber');

  // úvod přes herní box, 2 minuty jen u IT admina, tlačítko v hlavičce schované
  const stage = page.locator('#s-stage');
  await expect(stage).toHaveAttribute('data-scene', 'intro');
  await expect(page.locator('#v-kyber .vtag')).toContainText('2 minuty');
  await expect(page.locator('#s-intro')).toContainText('Tvůj první zásah, 2 minuty');
  await expect(page.locator('#s-intro h3')).toHaveText('Někdo se dobývá do serveru pekárny Kvásek');
  await expect(page.locator('#s-intro .noc-rules li')).toHaveText(['Za rychlost', 'Za správná rozhodnutí', 'Za ubráněný server']);
  await expect(page.locator('.prog')).toBeHidden();
  await expect(page.locator('#s-done')).toHaveCount(0);
  await page.locator('#s-start').click();
  await expect(page.locator('#s-intro')).toBeHidden();

  // vlevo chat a krok, vpravo mapa s legendou nad terminálem, mapa zhruba 40 % výšky (UX-07)
  await expect(page.locator('#s-chat')).toContainText('Promiň, že budím.');
  const main = (await page.locator('.noc-main').boundingBox())!;
  const map = (await page.locator('.noc-mapbox').boundingBox())!;
  const term = (await page.locator('.noc-termbox').boundingBox())!;
  expect(map.x).toBeGreaterThan(main.x + main.width - 1);
  expect(term.y).toBeGreaterThan(map.y + map.height - 1);
  expect(map.height / (map.height + term.height)).toBeGreaterThan(0.35);
  expect(map.height / (map.height + term.height)).toBeLessThan(0.45);
  await expect(page.locator('.noc-legend li')).toHaveText(['útočník', 'běžní uživatelé', 'server Kvásek']);
  await expect(page.locator('#s-map text').first()).toHaveText('útočník');
  await expect(page.locator('.noc-chat')).toHaveCSS('height', '120px');

  // příkaz má vysvětlení pod ikonou ⓘ a po spuštění lidské shrnutí, nový výpis svítí (UX-06)
  const info = page.locator('.noc-info');
  await info.click();
  await expect(page.locator('#s-tip')).toHaveText('Vypíše poslední 4 neúspěšné pokusy o přihlášení ze záznamu serveru.');
  await expect(info).toHaveAttribute('aria-expanded', 'true');
  await page.locator('[data-cmd="grep"]').click();
  await expect(page.locator('#s-out .blk.new')).toHaveCount(1);
  await expect(page.locator('#s-out .blk.new')).toContainText('Failed password for petra');
  await expect(page.locator('.noc-carry')).toHaveText('Někdo zkouší hesla k účtům root, admin a petra, pořád ze stejné adresy.');
  await expect(page.locator('#s-out .blk.new')).toHaveCount(0, { timeout: 3_000 });
  await page.locator('[data-cmd="count"]').click();

  // špatná adresa: červeně s ✕, vysvětlení, Zkusit znovu a hvězda za rozhodnutí napoprvé je pryč
  await page.locator('[data-q1="1"]').click();
  await expect(page.locator('#s-fb')).toContainText('Tři pokusy jsou nejspíš někdo z kanceláře, kdo si spletl heslo.');
  await expect(page.locator('#s-fb')).toContainText('Hvězda za rozhodnutí napoprvé je pryč, hra ale pokračuje.');
  await expect(page.locator('[data-q1="1"]')).toHaveClass(/\bno\b/);
  await expect(page.locator('[data-q1="1"] .i-no')).toBeVisible();
  await expect(page.locator('#s-stars')).toContainText('2/3');
  await expect(page.locator('[data-q1="0"]')).toBeDisabled();
  await page.locator('#s-retry').click();
  await expect(page.locator('#s-fb')).toHaveCount(0);
  await expect(page.locator('[data-q1="1"]')).toBeDisabled();
  await page.locator('[data-q1="0"]').click();

  // zablokování je žluté jako každá akce, ne červené (UX-08); počítadlo stojí a poplach skončí
  const ufw = page.locator('[data-cmd="ufw"]');
  await expect(ufw).toHaveCSS('background-color', 'rgb(250, 186, 32)');
  await ufw.click();
  await expect(stage).toHaveAttribute('data-scene', 'fight');
  await expect(page.locator('#s-out .blk').last()).toContainText('Rule inserted');
  await expect(page.locator('#s-map text').first()).toHaveText('zablokováno');
  const stopped = await page.locator('#s-tries').innerText();
  await page.locator('[data-cmd="last"]').click();
  await expect(page.locator('#s-chat .noc-msg')).toHaveCount(3);
  await expect(page.locator('#s-chat .noc-msg').last()).toContainText('Jenže Petra ve tři ráno spí.');
  await expect(page.locator('#s-chat .noc-msg.old')).toHaveCount(2);
  await page.locator('[data-q2="1"]').click();
  await expect(page.locator('#s-tries')).toHaveText(stopped);

  // štíty: špatný vysvětlí, Zkusit znovu ho odebere
  await page.locator('[data-shield="klic"]').click();
  await page.locator('[data-shield="vypinat"]').click();
  await page.locator('#s-deploy').click();
  await expect(page.locator('#s-fb')).toContainText('Objednávky chodí brzy ráno, pekárna by přišla o zákazníky.');
  await expect(page.locator('#s-fb .noc-fb-star')).toHaveCount(0);
  await page.locator('#s-retry').click();
  await expect(page.locator('#s-count')).toHaveText('Vybráno 1/2');
  await page.locator('[data-shield="fail2ban"]').click();
  await page.locator('#s-deploy').click();

  // výsledková karta v herním boxu: hvězdy, čas, srovnání, dovednosti a jedno hlavní tlačítko (UX-04)
  await expect(page.locator('#s-result')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#s-grid')).toBeHidden();
  await expect(stage).toHaveAttribute('data-scene', 'safe');
  await expect(page.locator('#s-pct')).toHaveText('100 %');
  await expect(page.locator('#s-safe')).toHaveText('Server je v bezpečí');
  await expect(page.locator('#s-result .noc-rstars')).toContainText('2/3');
  await expect(page.locator('#s-result .noc-rstars svg.on')).toHaveCount(2);
  await expect(page.locator('#s-result .noc-rtime')).toHaveText(/^Zásah za \d:\d\d$/);
  await expect(page.locator('#s-result .noc-compare')).toHaveText('Pod 1 minutu to zvládne jen každý třetí.');
  await expect(page.locator('#s-result .noc-skills li')).toHaveText(['Čtení logů', 'Firewall', 'Správa účtů', 'SSH klíče']);
  await expect(page.locator('#s-result')).toContainText('Přesně tohle dělají IT administrátoři každý den. A přesně tohle se naučíš v kurzu.');
  await expect(page.locator('#v-kyber .btn-primary:visible')).toHaveText(['Co dál?']);
  await expect(page.locator('#s-replay')).toHaveText('Zahrát znovu');
  await expect(page.locator('#s-share')).toHaveText('Sdílet výsledek');
  await expect(page.locator('.prog')).toBeHidden();
  expect((await widgetState(page)).kyber).toMatchObject({ status: 'done', firstOk: 1, mistakes: 2 });

  const next = page.locator('#s-next');
  await expect(next).toBeInViewport({ ratio: 1 });
  await next.click();
  await expect(page.locator('#r-reco h2')).toHaveText('Kyberbezpečnost');
  await expect(page.locator('.prog')).toBeVisible();
  const reco = (await page.locator('#r-reco').boundingBox())!;
  const priceBox = (await page.locator('#r-price-box').boundingBox())!;
  expect(priceBox.y).toBeGreaterThan(reco.y + reco.height - 1);
  expect(Math.round(priceBox.x)).toBe(Math.round(reco.x));
  expect(errors).toEqual([]);
});

test('C1: na mobilu jde přehled, chat, krok, sbalitelný terminál na 6 řádků a mapa pod sebou', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=kyber');
  await page.locator('#s-start').click();
  await expect(page.locator('[data-cmd="grep"]')).toBeEnabled();
  const order = ['.noc-hud', '#s-chat', '#s-step', '.noc-termbox', '.noc-mapbox'];
  const boxes = await Promise.all(order.map(async sel => (await page.locator(sel).boundingBox())!));
  for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.y, order[i]).toBeGreaterThanOrEqual(boxes[i - 1]!.y + boxes[i - 1]!.height - 1);

  // terminál má výšku na 6 řádků a jde sbalit
  const lines = await page.locator('#s-out').evaluate(e => {
    const st = getComputedStyle(e);
    return (e.clientHeight - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom)) / parseFloat(st.lineHeight);
  });
  expect(Math.round(lines)).toBe(6);
  const toggle = page.locator('#s-term-toggle');
  await expect(toggle).toHaveText('Terminál');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#s-out')).toBeHidden();
  await toggle.click();
  await expect(page.locator('#s-out')).toBeVisible();

  // tlačítka aspoň 44 px vysoká (UX-12)
  for (const sel of ['[data-cmd="grep"]', '.noc-info', '#s-term-toggle']) {
    expect((await page.locator(sel).boundingBox())!.height, sel).toBeGreaterThanOrEqual(44);
  }
});

test('C3: IT admin: text je čitelný i po najetí myší (kontrast aspoň 4,5 : 1)', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=kyber');
  /** Kontrast textu v prvku vůči pozadí pod ním, když je nad prvkem myš. Poloprůhledná pozadí se skládají až k prvnímu plnému (WCAG, běžný text aspoň 4,5). */
  const contrast = async (target: string, inner: string | null = null) => {
    const b = page.locator(target);
    await b.hover();
    return b.evaluate((el, sel) => {
      type Rgba = [number, number, number, number];
      const parse = (c: string): Rgba => {
        const v = c.match(/[\d.]+/g)!.map(Number);
        return [v[0]!, v[1]!, v[2]!, v.length > 3 ? v[3]! : 1];
      };
      const over = (top: Rgba, under: Rgba): Rgba => [0, 1, 2].map(i => top[i]! * top[3] + under[i]! * (1 - top[3])).concat(1) as Rgba;
      const textEl = sel ? el.querySelector(sel)! : el;
      const layers: Rgba[] = [];
      for (let n: Element | null = textEl; n; n = n.parentElement ?? ((n.getRootNode() as ShadowRoot).host ?? null)) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c[3] > 0) layers.push(c);
        if (c[3] >= 1) break;
      }
      let bg: Rgba = [255, 255, 255, 1];
      for (const l of layers.reverse()) bg = over(l, bg);
      const fg = over(parse(getComputedStyle(textEl).color), bg);
      const lum = (c: Rgba) => {
        const [r, g, b] = c.slice(0, 3).map(v => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const [a, z] = [lum(fg), lum(bg)];
      return (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05);
    }, inner);
  };
  const ok = async (target: string, inner: string | null, what: string) => expect(await contrast(target, inner), what).toBeGreaterThanOrEqual(4.5);

  await ok('#s-start', null, 'Začít zásah');
  await page.locator('#s-start').click();
  await ok('[data-cmd="grep"]', 'span', 'název příkazu na žlutém tlačítku');
  await ok('[data-cmd="grep"]', 'code', 'příkaz na žlutém tlačítku');
  await ok('.noc-info', null, 'ikona ⓘ');
  await page.locator('[data-cmd="grep"]').click();
  await ok('[data-cmd="count"]', 'code', 'příkaz Spočítat');
  await ok('.noc-carry', 'span', 'shrnutí předchozího příkazu');
  await page.locator('[data-cmd="count"]').click();
  await ok('[data-q1="1"]', '.num', 'počet pokusů u adresy');
  await ok('[data-q1="1"]', '.noc-ip > span', 'adresa');
  await page.locator('[data-q1="1"]').click();
  await ok('#s-fb', 'p', 'vysvětlení chyby');
  await ok('#s-fb', '.noc-fb-star span', 'ztracená hvězda');
  await ok('#s-retry', null, 'Zkusit znovu');
  await ok('[data-q1="1"]', '.noc-ip > span', 'špatná adresa');
  await page.locator('#s-retry').click();
  await page.locator('[data-q1="0"]').click();
  await ok('[data-cmd="ufw"]', 'code', 'příkaz Zablokovat');
  await page.locator('[data-cmd="ufw"]').click();
  await page.locator('[data-cmd="last"]').click();
  await ok('#s-chat .noc-msg.old >> nth=0', '.bub', 'starší zpráva v chatu');
  await ok('#s-chat .noc-msg:last-child', '.bub small', 'jméno v nejnovější zprávě');
  await ok('[data-q2="0"]', 'span:last-child', 'volba u účtu');
  await page.locator('[data-q2="1"]').click();
  await ok('[data-shield="fail2ban"]', 'small', 'podtext štítu');
  await ok('[data-shield="klic"]', 'span > span', 'název štítu');
  await page.locator('[data-shield="klic"]').click();
  await page.locator('[data-shield="fail2ban"]').click();
  await ok('#s-deploy', null, 'Nasadit štíty');
  await ok('.noc-count', null, 'Vybráno 2/2');
  await page.locator('#s-deploy').click();
  await expect(page.locator('#s-result')).toBeVisible({ timeout: 10_000 });
  await ok('#s-result .noc-compare', null, 'srovnání s hráči');
  await ok('#s-result .noc-skills li >> nth=0', null, 'dovednost');
  await ok('#s-safe', null, 'Server je v bezpečí');
  await ok('#s-next', null, 'Co dál?');
  await ok('#s-replay', null, 'Zahrát znovu');
  await ok('#s-share', null, 'Sdílet výsledek');
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
  await expect(more.nth(1)).toContainText('asi 2 minuty');

  await solveData(page);
  await page.locator('#v-data [data-go="kyber"]').click();
  await expect(page.locator('#v-kyber')).toBeVisible();
  expect((await focused(page)).text).toBe('Někdo se dobývá do serveru pekárny');
  const fromKyber = page.locator('#v-kyber [data-more] .other[data-go="data"]');
  await expect(fromKyber).toContainText('Hotovo ✓');
  await solveKyber(page);
  await expect(page.locator('.prog')).toBeHidden();

  // dvě hotové: doporučení s bonusem za vstup, ostatní odškrtnuté
  await page.locator('#s-next').click();
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
  await expect(page.locator('.path-card[data-go="kyber"] .foot')).toContainText('2 minuty');
  await expect(page.locator('.path-card[data-go="hry"] .foot')).toContainText('5 minut');
  await expect(page.locator('#start-badges, .badges, .minis')).toHaveCount(0);
});
