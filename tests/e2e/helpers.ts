/* Společné pomůcky pro testy widgetu. Lokátory Playwrightu procházejí otevřeným
   shadow root, kód v page.evaluate ne: tam se vždy jde přes host.shadowRoot (R1, A16). */
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { State } from '../../src/logic/state.ts';

export const MOBILE = { width: 390, height: 844 };
export const LAPTOP = { width: 1366, height: 768 };
export const NBSP = ' ';

/** Chyby skriptu a konzole ze stránky. Nenačtená písma a CDN mimo localhost nepočítá. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => {
    const url = m.location().url;
    if (m.type() === 'error' && (!url || url.startsWith('http://localhost'))) errors.push(m.text());
  });
  return errors;
}

/** Otevře stránku a počká, až custom element vykreslí obsah. */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator('section.view:visible')).toHaveCount(1);
}

/** Otevře samostatnou stránku se schovaným Stavěním s AI: do HTML doplní atribut data-ukazky. Stránka sama ho nemá. */
export async function openWithAi(page: Page, path: string): Promise<void> {
  await page.route('**/index.html*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('<prace-na-zkousku ', '<prace-na-zkousku data-ukazky="data ai hry kyber" ');
    await route.fulfill({ response, body });
  });
  await open(page, path);
}

/** Prvek s fokusem uvnitř widgetu (document.activeElement je jen hostitel). */
export function focused(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector('prace-na-zkousku')!;
    const a = host.shadowRoot!.activeElement as HTMLElement | null;
    return { text: a?.textContent?.replace(/ /g, ' ').trim() ?? null, id: a?.id ?? '', go: a?.dataset.go ?? '' };
  });
}

export const widgetState = (page: Page) => page.evaluate(() => (document.querySelector('prace-na-zkousku') as unknown as { state: State }).state);

/** Šířka obsahu stránky, pro kontrolu vodorovného přetečení. */
export const scrollWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth);

/** Volba v datové ukázce. Starší tlačítka jsou po odpovědi vypnutá, Playwright počká na nová. */
export const dataOpt = (page: Page, n: number) => page.locator(`#d-options [data-opt="${n}"]`).click();
/** Klik na sloupec nebo řádek grafu v datové ukázce. */
export const dataBar = (page: Page, n: number) => page.locator(`#d-chart [data-bar="${n}"]`).click();

/** Datová analýza projitá bez chyby: data, měsíce, březen, dny, víkend, produkty, snídaně, zpráva Janě. onStep se volá po každém rozhodnutí. */
export async function solveData(page: Page, onStep: () => Promise<void> = async () => {}): Promise<void> {
  const moves: [typeof dataOpt, number][] = [[dataOpt, 1], [dataOpt, 2], [dataBar, 2], [dataOpt, 0], [dataBar, 5], [dataOpt, 1], [dataBar, 2], [dataOpt, 2]];
  for (const [move, n] of moves) {
    await move(page, n);
    await onStep();
  }
  await expect(page.locator('#d-done')).toBeVisible();
}

/** Kyberbezpečnost bez chyby až po tlačítko k výsledku. onStep se volá po každém kroku. */
export async function solveKyber(page: Page, onStep: () => Promise<void> = async () => {}): Promise<void> {
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

/** Prohlížeč bere fixed prvky shadow DOM jako hostitele, elementFromPoint proto vrací widget nebo prvek webu. */
export function hitsWidget(page: Page, x: number, y: number) {
  return page.evaluate(([px, py]) => {
    const e = document.elementFromPoint(px!, py!);
    return e?.tagName.toLowerCase() === 'prace-na-zkousku' ? 'widget' : (e?.id || e?.className || e?.tagName || 'nic');
  }, [x, y]);
}
