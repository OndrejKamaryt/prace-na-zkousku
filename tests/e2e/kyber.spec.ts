/* QA scénáře 1 až 8 z Martinova zadání UX pro IT admina (kapitola 6).
   Scénář 9 (události v analytice) je v embed.spec.ts, kde ukázka běží v iframe. */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { KYBER_MOVES, LAPTOP, MOBILE, focused, num, open, solveKyber, tabTo, widgetState } from './helpers.ts';

/** Projde hru po štíty. Klik počká, až volba jde zmáčknout. */
async function toShields(page: Page) {
  for (const sel of KYBER_MOVES.slice(0, KYBER_MOVES.indexOf('[data-shield="klic"]'))) await page.locator(sel).click();
  await expect(page.locator('[data-shield="klic"]')).toBeEnabled();
}

test('QA1: po 20 s bez akce je čas 0:00, útok neběží a je vidět Začít zásah; skrytá záložka čas zastaví', async ({ page }) => {
  await page.clock.install();
  await page.setViewportSize(LAPTOP);
  await open(page, '/index.html?ukazka=kyber');
  const tries = await page.locator('#s-tries').innerText();
  await page.clock.runFor(20_000);
  await expect(page.locator('#s-time')).toHaveText('0:00');
  await expect(page.locator('#s-tries')).toHaveText(tries);
  await expect(page.locator('#s-stage')).toHaveAttribute('data-scene', 'intro');
  await expect(page.locator('#s-packets circle')).toHaveCount(0);
  await expect(page.locator('#s-map animate, #s-map animateTransform')).toHaveCount(0);
  await expect(page.locator('#s-start')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('#s-start')).toHaveText('Začít zásah');

  // po startu běží čas od nuly a přibývají pokusy
  await page.locator('#s-start').click();
  await page.clock.runFor(3_000);
  await expect(page.locator('#s-time')).toHaveText('0:03');
  expect(await num(page, '#s-tries')).toBeGreaterThan(parseInt(tries.replace(/\s/g, ''), 10));

  // skrytá záložka čas zastaví, po návratu běží dál
  const visibility = (hidden: boolean) => page.evaluate(h => {
    Object.defineProperty(document, 'hidden', { value: h, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  await visibility(true);
  await page.clock.runFor(10_000);
  await expect(page.locator('#s-time')).toHaveText('0:03');
  await visibility(false);
  await page.clock.runFor(2_000);
  await expect(page.locator('#s-time')).toHaveText('0:05');
});

test('QA2: volby nejdou zvolit, dokud není celá zpráva, a mezi objevením a kliknutím neposkočí', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize(LAPTOP);
  await open(page, '/index.html?ukazka=kyber');
  // zapisovač fází: při objevení otázky se zkusí kliknout na volby a změří se, kde jsou
  await page.evaluate(() => {
    const root = document.querySelector('prace-na-zkousku')!.shadowRoot!;
    const step = root.querySelector<HTMLElement>('#s-step')!, chat = root.querySelector('#s-chat')!;
    // poloha vůči hernímu boxu, ať nevadí, že se stránka po startu ještě posouvá
    const stage = root.querySelector('#s-stage')!;
    const rects = () => Array.from(step.querySelectorAll('[data-choice]')).map(b => {
      const r = b.getBoundingClientRect(), o = stage.getBoundingClientRect();
      return [r.x - o.x, r.y - o.y, r.width, r.height].map(Math.round).join(' ');
    });
    const log: unknown[] = [];
    (window as unknown as { phases: unknown[] }).phases = log;
    new MutationObserver(() => {
      const phase = step.dataset.phase;
      if (phase === 'question') {
        const choices = Array.from(step.querySelectorAll<HTMLButtonElement>('[data-choice]'));
        const before = step.innerHTML;
        choices.forEach(b => b.click());
        log.push({ phase, typing: !!chat.querySelector('.typing'), last: (chat.lastElementChild?.textContent ?? '').replace(/ /g, ' '), disabled: choices.every(b => b.disabled), clicked: step.innerHTML !== before || step.dataset.phase !== 'question', rects: rects() });
      } else if (phase === 'choices') {
        log.push({ phase, rects: rects() });
      }
    }).observe(step, { attributes: true, attributeFilter: ['data-phase'] });
  });
  await solveKyber(page);
  const log = await page.evaluate(() => (window as unknown as { phases: { phase: string; typing?: boolean; last?: string; disabled?: boolean; clicked?: boolean; rects: string[] }[] }).phases);
  const asks = log.filter(x => x.phase === 'question');
  expect(asks.length).toBe(7);
  // tři takty začínají Terezinou zprávou a ta je při objevení otázky celá vypsaná
  const says = ['Promiň, že budím.', 'Správně! Tolik pokusů', 'Útočník je venku.', 'Ve 3:12 se z adresy útočníka přihlásila Petra.'];
  for (const x of asks) {
    expect(x.typing, 'Tereza ještě píše').toBe(false);
    expect(x.disabled, 'volby jdou zmáčknout dřív než po zprávě').toBe(true);
    expect(x.clicked, 'klik před zprávou něco udělal').toBe(false);
  }
  expect(says.every(text => asks.some(x => x.last!.includes(text)))).toBe(true);
  // mezi objevením volby a chvílí, kdy jde zmáčknout, se nic nepohne
  for (let i = 0; i < log.length; i++) {
    if (log[i]!.phase === 'question') expect(log[i + 1]!.rects, 'volby poskočily').toEqual(log[i]!.rects);
  }
});

test('QA3: v kroku 1 ukazuje přehled, terminál i karta adresy stejné číslo', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await open(page, '/index.html?ukazka=kyber');
  await page.locator('#s-start').click();
  await page.locator('[data-cmd="grep"]').click();
  // do spočítání útočníkovi pokusy přibývají
  await expect(page.locator('[data-cmd="count"]')).toBeEnabled({ timeout: 15_000 });
  const before = await num(page, '#s-tries');
  await expect.poll(() => num(page, '#s-tries')).toBeGreaterThan(before);
  await page.locator('[data-cmd="count"]').click();
  await expect(page.locator('[data-q1="0"]')).toBeEnabled({ timeout: 15_000 });

  const hud = await num(page, '#s-tries');
  const card = await num(page, '#s-ip0');
  const line = (await page.locator('#s-out .blk').last().innerText()).split('\n').find(l => l.includes('203.0.113.47'))!;
  const term = parseInt(line.trim(), 10);
  expect(card).toBe(hud);
  expect(term).toBe(hud);
  await expect(page.locator('.noc-carry')).toContainText('Jedna adresa to zkusila ' + hud.toLocaleString('cs-CZ') + '×');
  // po spočítání počítadlo stojí
  await page.waitForTimeout(800);
  expect(await num(page, '#s-tries')).toBe(hud);
});

test('QA4: bez chyby je pruh 100 % plný a zelený, 3/3 hvězdy a výsledková karta je před cenou', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=kyber');
  // pod 40 % je pruh červený, od 40 % žlutý
  await expect(page.locator('#s-meter')).toHaveCSS('background-color', 'rgb(216, 27, 83)');
  await solveKyber(page, async () => {
    if ((await page.locator('#s-pct').innerText()).startsWith('50')) await expect(page.locator('#s-meter')).toHaveCSS('background-color', 'rgb(250, 186, 32)');
  });
  const meter = await page.locator('#s-meter').evaluate(e => ({ w: e.getBoundingClientRect().width, track: e.parentElement!.getBoundingClientRect().width, bg: getComputedStyle(e).backgroundColor }));
  expect(Math.abs(meter.w - meter.track)).toBeLessThan(1);
  expect(meter.bg).toBe('rgb(47, 163, 90)');
  await expect(page.locator('#s-pct')).toHaveText('100 %');
  await expect(page.locator('#s-stars svg.on')).toHaveCount(3);
  await expect(page.locator('#s-stars')).toContainText('3/3');
  await expect(page.locator('#s-result .noc-rstars svg.on')).toHaveCount(3);
  await expect(page.locator('#s-result .noc-rstars')).toContainText('3/3');
  // cena se objeví až po výsledkové kartě
  await expect(page.locator('#r-price')).toBeHidden();
  expect((await widgetState(page)).kyber).toMatchObject({ status: 'done', firstOk: 3, mistakes: 0 });
  await page.locator('#s-next').click();
  await expect(page.locator('#r-price')).toBeVisible();
});

test('QA5: každá špatná volba má vysvětlení, Zkusit znovu a první chyba vezme hvězdu', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=kyber');
  const fb = page.locator('#s-fb');
  /** Špatná volba: označená ✕, vysvětlení, „Zkusit znovu“, hvězda jen při první chybě. Po „Zkusit znovu“ zůstane vypnutá. */
  const wrong = async (sel: string, why: string, first = false) => {
    await page.locator(sel).click();
    await expect(fb).toContainText(why);
    await expect(fb.locator('.noc-fb-star')).toHaveCount(first ? 1 : 0);
    await expect(page.locator(sel)).toHaveClass(/\bno\b/);
    await expect(page.locator('#s-stars')).toContainText('2/3');
    await page.locator('#s-retry').click();
    await expect(fb).toHaveCount(0);
    await expect(page.locator(sel)).toBeDisabled();
  };
  for (const sel of KYBER_MOVES.slice(0, 3)) await page.locator(sel).click();
  await expect(page.locator('#s-stars')).toContainText('3/3');
  await wrong('[data-q1="1"]', 'Tři pokusy jsou nejspíš někdo z kanceláře, kdo si spletl heslo.', true);
  await wrong('[data-q1="2"]', 'Jeden neúspěšný pokus je běžný překlep.');
  for (const sel of ['[data-q1="0"]', '[data-cmd="ufw"]', '[data-cmd="last"]']) await page.locator(sel).click();
  await wrong('[data-q2="0"]', 'Smazáním přijdeš o stopy, co útočník dělal, a Petra o data. Účet radši zamkni a prověř.');
  await wrong('[data-q2="2"]', 'Firewall blokuje jen jednu adresu. Útočník zná Petřino heslo a může přijít odjinud.');
  await page.locator('[data-q2="1"]').click();

  // dva špatné štíty: obě vysvětlení, po Zkusit znovu jsou odebrané a vypnuté
  await page.locator('[data-shield="vypinat"]').click();
  await page.locator('[data-shield="prejmenovat"]').click();
  await page.locator('#s-deploy').click();
  await expect(fb).toContainText('Objednávky chodí brzy ráno, pekárna by přišla o zákazníky. A útok může přijít i ve dne.');
  await expect(fb).toContainText('Útočník útočí na adresu, ne na jméno. Přejmenování nic nezmění.');
  await expect(page.locator('.noc-shield.no')).toHaveCount(2);
  await page.locator('#s-retry').click();
  await expect(page.locator('#s-count')).toHaveText('Vybráno 0/2');
  await expect(page.locator('[data-shield="vypinat"]')).toBeDisabled();
  await expect(page.locator('[data-shield="prejmenovat"]')).toBeDisabled();
  await page.locator('[data-shield="klic"]').click();
  await page.locator('[data-shield="fail2ban"]').click();
  await page.locator('#s-deploy').click();
  // hra pokračuje do konce, chyby vzaly jen hvězdu za rozhodnutí
  await expect(page.locator('#s-result .noc-rstars')).toContainText('2/3');
  expect((await widgetState(page)).kyber).toMatchObject({ status: 'done', firstOk: 0, mistakes: 5 });
});

test('QA6: krok 3 s jedním výběrem nejde nasadit a třetí štít vybrat nejde', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=kyber');
  await toShields(page);
  const deploy = page.locator('#s-deploy'), count = page.locator('#s-count'), hint = page.locator('#s-hint');
  await expect(count).toHaveText('Vybráno 0/2');
  await expect(deploy).toBeDisabled();
  await expect(page.locator('[data-shield="fail2ban"] small')).toHaveText('nástroj fail2ban');
  await expect(page.locator('.noc-shields small')).toHaveCount(1);
  await page.locator('[data-shield="klic"]').click();
  await expect(count).toHaveText('Vybráno 1/2');
  await expect(deploy).toBeDisabled();
  await page.locator('[data-shield="fail2ban"]').click();
  await expect(count).toHaveText('Vybráno 2/2');
  await expect(deploy).toBeEnabled();
  // třetí výběr: zůstane nevybraný a ukáže se hláška
  await page.locator('[data-shield="vypinat"]').click();
  await expect(hint).toHaveText('Vybrat jde jen dva štíty. Nejdřív jeden odeber.');
  await expect(page.locator('[data-shield="vypinat"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(count).toHaveText('Vybráno 2/2');
  // po odebrání hláška zmizí a tlačítko zase nejde
  await page.locator('[data-shield="klic"]').click();
  await expect(hint).toBeHidden();
  await expect(count).toHaveText('Vybráno 1/2');
  await expect(deploy).toBeDisabled();
});

for (const vp of [{ width: 1366, height: 720 }, MOBILE]) {
  test(`QA7: na ${vp.width} × ${vp.height} je celý krok vidět bez posouvání`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/index.html?ukazka=kyber');
    await expect(page.locator('#s-start')).toBeInViewport({ ratio: 1 });
    const wide = vp.width > 760;
    await page.locator('#s-start').click();
    for (const sel of KYBER_MOVES.slice(1)) {
      const target = page.locator(sel);
      await expect(target).toBeEnabled();
      // celý krok i s tlačítkem, nad ním přehled a chat; na počítači celý herní box (UX-09)
      for (const part of ['.noc-hud', '#s-chat', '#s-step', ...(wide ? ['#s-stage'] : [])]) {
        await expect(page.locator(part), `${part} před ${sel}`).toBeInViewport({ ratio: 1 });
      }
      await target.click();
    }
    await expect(page.locator('#s-result')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#s-safe')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#s-next')).toBeInViewport({ ratio: 1 });
    if (wide) await expect(page.locator('#s-stage')).toBeInViewport({ ratio: 1 });
  });
}

test('QA8: hra jde dohrát jen klávesnicí i s omezenými animacemi', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=kyber');
  await tabTo(page, '#s-start');
  // fokus je vidět
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('prace-na-zkousku')!.shadowRoot!.activeElement!).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');
  expect(await page.locator('#s-stage').evaluate(e => getComputedStyle(e).animationName), 'poplach bez blikání').toBe('none');
  for (const sel of KYBER_MOVES.slice(1)) {
    await expect(page.locator(sel)).toBeEnabled();
    await tabTo(page, sel);
    await page.keyboard.press(sel.startsWith('[data-shield') ? 'Space' : 'Enter');
  }
  await expect(page.locator('#s-result')).toBeVisible({ timeout: 10_000 });
  expect((await focused(page)).id).toBe('s-safe');
  // bez animací: prstence se netočí, tečky nepulzují a nelétají
  await expect(page.locator('#s-map .ring')).toHaveCount(3);
  await expect(page.locator('#s-map animate, #s-map animateTransform')).toHaveCount(0);
  await expect(page.locator('#s-packets circle')).toHaveCount(0);
  await tabTo(page, '#s-next');
  await page.keyboard.press('Enter');
  await expect(page.locator('#v-vysledek')).toBeVisible();
  expect((await focused(page)).text).toBe('Kyberbezpečnost');
});

test('Zahrát znovu začne od kroku 1, do stavu se počítá jen první hra', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=kyber');
  await solveKyber(page);
  const first = (await widgetState(page)).kyber;
  expect(first).toMatchObject({ status: 'done', firstOk: 3, mistakes: 0 });
  await page.locator('#s-replay').click();
  await expect(page.locator('#s-result')).toBeHidden();
  await expect(page.locator('#s-intro')).toBeHidden();
  await expect(page.locator('#s-pct')).toHaveText('15 %');
  await expect(page.locator('#s-stars')).toContainText('3/3');
  await expect(page.locator('#s-out .blk')).toHaveCount(1);
  await page.locator('[data-cmd="grep"]').click();
  await page.locator('[data-cmd="count"]').click();
  await page.locator('[data-q1="1"]').click();
  await expect(page.locator('#s-stars')).toContainText('2/3');
  expect((await widgetState(page)).kyber).toEqual(first);
});

test('Sdílet výsledek na počítači zkopíruje text s odkazem na ukázku', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize(LAPTOP);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/index.html?ukazka=kyber');
  await solveKyber(page);
  await page.locator('#s-share').click();
  await expect(page.locator('#s-copied')).toHaveText('Odkaz je zkopírovaný.');
  const text = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\u00a0/g, ' ');
  expect(text).toMatch(/^Server pekárny Kvásek je v bezpečí\. Hvězdy 3\/3, čas zásahu \d:\d\d\. Zvládneš to rychleji\? http:\/\/localhost:\d+\/index\.html\?ukazka=kyber$/);
});
