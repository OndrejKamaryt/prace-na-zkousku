/* Odstup lepicí hlavičky webu a dolní lišty (A2, E2, E12). Výška se na
   coderslab.cz liší podle stránky i šířky okna (199, 175, 118, 60 i 0 px),
   proto se měří za běhu: sečtou se prvky se sticky nebo fixed, které drží
   u horního (dolního) okraje okna. data-scroll-offset s číslem měření přepíše. */

let cache: { at: number; host: Element | null; list: Element[] } = { at: 0, host: null, list: [] };

/** Prvky stránky s position sticky nebo fixed, mimo widget. Seznam platí chvilku, geometrie se čte vždy čerstvá. */
function pinned(host: Element): Element[] {
  const now = performance.now();
  if (cache.host === host && now - cache.at < 1000) return cache.list;
  const list: Element[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode(n) {
      if (n === host) return NodeFilter.FILTER_REJECT;
      const p = getComputedStyle(n as Element).position;
      if (p === 'fixed' || p === 'sticky') {
        list.push(n as Element);
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });
  while (walker.nextNode());
  cache = { at: now, host, list };
  return list;
}

export function resetPinnedCache(): void {
  cache = { at: 0, host: null, list: [] };
}

interface Bar {
  cs: CSSStyleDeclaration;
  r: DOMRect;
}
/** Viditelné lišty přes velkou část šířky okna, ne celoobrazovkové vrstvy. */
function bars(host: Element, maxHeight: number, minWidth: number): Bar[] {
  const out: Bar[] = [];
  for (const e of pinned(host)) {
    if (!e.isConnected) continue;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = e.getBoundingClientRect();
    if (r.height <= 0 || r.height > maxHeight || r.width < minWidth) continue;
    // sticky drží jen uvnitř rodiče: lepicí prvek z jiné části stránky widget nezakryje
    if (cs.position === 'sticky' && !e.parentElement?.contains(host)) continue;
    out.push({ cs, r });
  }
  return out;
}

/** Spodní hrana lepicí hlavičky ve chvíli, kdy je přilepená nahoře. */
export function measureTop(host: Element): number {
  const vw = innerWidth, vh = innerHeight;
  let bottom = 0;
  for (const { cs, r } of bars(host, vh * 0.5, vw * 0.5)) {
    let top: number;
    if (cs.position === 'fixed') {
      if (r.top > 1) continue;
      top = r.top;
    } else {
      top = parseFloat(cs.top);
      if (!Number.isFinite(top)) continue;
    }
    bottom = Math.max(bottom, top + r.height);
  }
  return Math.round(bottom);
}

/** Výška lišty přilepené dole přes celou šířku (mobilní navigace webu, 70 px). Vysokou lištu cookies nepočítá. */
export function measureBottom(host: Element): number {
  const vw = innerWidth, vh = innerHeight;
  let height = 0;
  for (const { r } of bars(host, 120, vw * 0.9)) {
    if (r.bottom < vh - 1) continue;
    height = Math.max(height, vh - r.top);
  }
  return Math.round(height);
}

/** Posun stránky. Web má scroll-behavior: smooth, proto se chování udává vždy výslovně. */
export function scrollPage(top: number, smooth: boolean): void {
  window.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'instant' });
}
