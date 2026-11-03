/* Drobné pomocníky pro práci s DOM ve shadow root. Hledají vždy v zadaném
   kořeni, nikdy v document, protože widget žije ve Shadow DOM (Z6, A4). */

export const esc = (s: unknown) =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function $<T extends Element = HTMLElement>(root: ParentNode, sel: string): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error('Ve widgetu chybí ' + sel);
  return el;
}
export const $$ = <T extends Element = HTMLElement>(root: ParentNode, sel: string): T[] => Array.from(root.querySelectorAll<T>(sel));

/** Vytvoří prvek z HTML. Texty jdou z cs.json (důvěryhodné), hodnoty od návštěvníka přes esc(). */
export function el<T extends HTMLElement = HTMLElement>(markup: string): T {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  const first = t.content.firstElementChild;
  if (!first) throw new Error('Prázdná šablona');
  return first as T;
}

export const isShown = (e: Element) => (e as HTMLElement).offsetParent !== null || getComputedStyle(e).position === 'fixed';
