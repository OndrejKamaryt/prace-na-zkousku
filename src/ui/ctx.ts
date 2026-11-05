/* Co obrazovky dostanou od widgetu. Stav mění jen funkcemi z logic/state.ts,
   navigaci a posouvání řeší widget. */
import type { State } from '../logic/state.ts';
import type { PathKey } from '../logic/types.ts';

export type View = 'start' | PathKey | 'vysledek';
export type Variant = 'embed' | 'standalone';

export interface Ctx {
  readonly host: HTMLElement;
  readonly root: ShadowRoot;
  readonly state: State;
  readonly variant: Variant;
  /** Ukázky, které se návštěvníkovi nabízejí (config.offered nebo atribut data-ukazky). */
  readonly offered: readonly PathKey[];
  /** prefers-reduced-motion: bez animací a čekání */
  readonly reduce: boolean;
  /** Dnešek pro data v ukázkách (rozhodnutí 19). */
  readonly today: Date;
  now(): number;
  /** Přepnutí obrazovky na pokyn návštěvníka: posune widget pod hlavičku webu a dá fokus na nadpis. */
  go(view: View): void;
  /** Ukázka je hotová: pruh s cestou k výsledku a stav na kartách. reveal = pruh hned odkrýt. */
  completed(k: PathKey, reveal: boolean): void;
  /** Posune stránku tak, aby byl prvek vidět pod lepicí hlavičkou (reveal() z prototypu). */
  reveal(el: Element | null | undefined): void;
  /** Posune stránku tak, aby prvek začínal hned pod lepicí hlavičkou (nový krok, výsledek ukázky). */
  alignTop(el: Element | null | undefined): void;
  /** Posune stránku jen tolik, aby byl prvek celý vidět nad dolní lištou webu. */
  keepVisible(el: Element | null | undefined): void;
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
