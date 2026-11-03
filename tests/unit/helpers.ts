import { createState } from '../../src/logic/state.ts';
import type { State } from '../../src/logic/state.ts';
import { snapshot } from '../../src/logic/state.ts';
import type { Snapshot } from '../../src/logic/types.ts';
import { fixTypography } from '../../src/logic/typography.ts';

/** Očekávaný text psaný s obyčejnými mezerami, pevné mezery doplní pravidla z CLAUDE.md. */
export const typo = (s: string) => fixTypography(s);

export const T0 = 1_700_000_000_000;
export const min = (n: number) => T0 + n * 60_000;

/** Stav upravený funkcí a jeho snímek v čase now. */
export function snap(build: (s: State) => void, now = min(10), init?: Parameters<typeof createState>): Snapshot {
  const s = createState(...(init ?? []));
  build(s);
  return snapshot(s, now);
}
