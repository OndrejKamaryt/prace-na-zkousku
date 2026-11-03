/* Pravidla hodnocení ze ZADANI, kap. 4. null = pole v Pipedrivu nechat být. */
import { IDEAS } from './types.ts';
import type { AiSnap, IdeaKey, PathKey, PathSnaps, Rating } from './types.ts';

/** Postavená aplikace s nejvíc úpravami, podle ní se hodnotí i mluví s obchodem. */
export function bestApp(ai: AiSnap): { idea: IdeaKey; changes: number } | null {
  let best: { idea: IdeaKey; changes: number } | null = null;
  for (const idea of IDEAS) {
    const a = ai.apps[idea];
    if (a?.built && (!best || a.changes > best.changes)) best = { idea, changes: a.changes };
  }
  return best;
}

export function rate(k: PathKey, p: PathSnaps): Rating | null {
  switch (k) {
    case 'data': {
      const d = p.data;
      if (d.status !== 'done') return null;
      if (d.revealed) return 'bad';
      return d.firstTry ? 'great' : 'average';
    }
    case 'ai': {
      const app = bestApp(p.ai);
      if (!app) return null;
      if (app.changes >= 2) return 'great';
      return app.changes === 1 ? 'average' : 'bad';
    }
    case 'hry': {
      const h = p.hry;
      if (h.ownWon) return 'great';
      if (h.defaultWon) return 'average';
      return h.status === 'skipped' ? 'bad' : null;
    }
    case 'kyber': {
      const c = p.kyber;
      if (c.status !== 'done') return null;
      if (c.firstOk >= 3) return 'great';
      return c.firstOk >= 1 ? 'average' : 'bad';
    }
  }
}
