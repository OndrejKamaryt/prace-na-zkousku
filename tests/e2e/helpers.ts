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

/** Prvek s fokusem uvnitř widgetu (document.activeElement je jen hostitel). */
export function focused(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector('prace-na-zkousku')!;
    const a = host.shadowRoot!.activeElement as HTMLElement | null;
    return { inDialog: !!a?.closest('dialog'), text: a?.textContent?.replace(/ /g, ' ').trim() ?? null, id: a?.id ?? '', go: a?.dataset.go ?? '' };
  });
}

export const widgetState = (page: Page) => page.evaluate(() => (document.querySelector('prace-na-zkousku') as unknown as { state: State }).state);

/** Šířka obsahu stránky, pro kontrolu vodorovného přetečení. */
export const scrollWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth);

/** Datová analýza vyřešená napoprvé, až po pruh s vyzvednutím odznaku. */
export async function solveData(page: Page): Promise<void> {
  await page.locator('#d-options .opt').nth(2).click();
  await expect(page.locator('#d-done')).toBeVisible();
}

/** Prohlížeč bere fixed prvky shadow DOM jako hostitele, elementFromPoint proto vrací widget nebo prvek webu. */
export function hitsWidget(page: Page, x: number, y: number) {
  return page.evaluate(([px, py]) => {
    const e = document.elementFromPoint(px!, py!);
    return e?.tagName.toLowerCase() === 'prace-na-zkousku' ? 'widget' : (e?.id || e?.className || e?.tagName || 'nic');
  }, [x, y]);
}
