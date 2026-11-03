/* Co obrazovky dostanou od widgetu. Stav mění jen funkcemi z logic/state.ts,
   navigaci, posouvání a oslavu odznaku řeší widget. */
import type { State } from '../logic/state.ts';
import type { PathKey } from '../logic/types.ts';

export type View = 'start' | PathKey | 'vysledek';
export const VIEWS: readonly View[] = ['start', 'data', 'ai', 'hry', 'kyber', 'vysledek'];
export type Variant = 'embed' | 'standalone';

export interface Ctx {
  readonly host: HTMLElement;
  readonly root: ShadowRoot;
  readonly state: State;
  readonly variant: Variant;
  /** prefers-reduced-motion: bez animací, čekání a konfet */
  readonly reduce: boolean;
  /** Dnešek pro data v ukázkách (rozhodnutí 19). */
  readonly today: Date;
  now(): number;
  /** Přepnutí obrazovky na pokyn návštěvníka: posune widget pod hlavičku webu a dá fokus na nadpis. */
  go(view: View): void;
  /** Ukázka je hotová: odznak k vyzvednutí, stav na kartách, pruh s odznaky. first = poprvé. */
  completed(k: PathKey, first: boolean): void;
  /** Posune stránku tak, aby byl prvek vidět pod lepicí hlavičkou (reveal() z prototypu). */
  reveal(el: Element | null | undefined): void;
  /** Posune stránku tak, aby byl prvek uprostřed místa pod hlavičkou. */
  center(el: Element): void;
  /** Výška lepicí hlavičky webu nahoře a lišty dole v px. */
  topOffset(): number;
  bottomOffset(): number;
  /** Šířka widgetu, ne okna (A7). */
  width(): number;
  /** Zavolá fn při změně šířky widgetu nebo výšky okna. Vrací odhlášení. */
  onResize(fn: () => void): () => void;
  wait(ms: number): Promise<void>;
}

export interface Screen {
  readonly el: HTMLElement;
  /** Nadpis, na který jde fokus po přepnutí. */
  readonly heading: HTMLElement | null;
  show?(): void;
  hide?(): void;
  destroy?(): void;
}
