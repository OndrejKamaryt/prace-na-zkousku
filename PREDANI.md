# Předání: po fázi 2 (widget jako embed)

Shrnutí ze dne 3. 11. 2026. Rozhodnutí a jejich důvody jsou v `PLAN.md` (sekce „Rozhodnuto“), podrobné nálezy v `NALEZY.md` (odkazy typu A1, Z6 vedou tam). Zadání je `ZADANI.md`, pravidla `CLAUDE.md`.

## Stav

- **Fáze 1 a 2 (sloučená s fází 3) jsou hotové.** Skutečný widget `<prace-na-zkousku>` s otevřeným Shadow DOM, primárně pro vložení do stránky webu (`data-variant="embed"`, výchozí), samostatná stránka přes `data-variant="standalone"`.
- **Testy:** 78 unit testů (Vitest) a 34 Playwright testů v Edge přes `http://localhost` (`npm run test:e2e`), jeden odložený do fáze 6 (`test.fixme`, dotykové cíle 44 px). Typecheck i build jsou čisté, widget má 38,9 kB gzip (cíl 80 kB).
- **Demo:** https://ondrejkamaryt.github.io/prace-na-zkousku/ je ukázka pro tým a ukazuje jen samostatnou stránku (`index.html`, `data-variant="standalone"`). Napodobenina webu (`test-host.html`) slouží jen testům, prototyp je v repu. Sestavuje ho `node scripts/build-site.ts` (spustí i `vite build`), nasazuje `.github/workflows/pages.yml` při pushi do `main`.
- Snímky ze 3. 11. sedí s referenčními screenshoty (úvod, AI, kyber, výsledek a okno s odznakem jsem porovnal vedle sebe), rozdíl je jen ve vyřazených částech (štítek Prototyp, patička, panel obchodníka).

## Struktura

- `src/widget.ts` custom element: atributy, navigace bez hashe, posouvání, pruh s odznaky, vyzvednutí odznaku. `src/main.ts` ho registruje jen jednou (A15).
- `src/screens/` obrazovky: `start`, `data`, `ai` a `ai-apps`, `game`, `kyber`, `result`. Stav mění jen funkcemi z `src/logic/state.ts`.
- `src/ui/` styly (`styles.css`, `screens.css`, tokeny na `:host`, `@container` místo `@media`), okno s odznakem (`celebrate.ts`, `<dialog>` přes `showModal()`), měření hlavičky (`scroll.ts`), sdílené části a ikony.
- `src/content/cs.json` všechny texty rozhraní, `config.json` ceny a odkazy, `fixtures.ts` technické ukázky (SQL, kód aplikací, výpisy terminálu), na které se typografie nevztahuje.
- `index.html` samostatná stránka (zároveň ukázka pro tým), `test-host.html` napodobenina webu (parametry `?podmenu=56|80|0`, `?start=`, `?offset=`, `?cookies=0`). Vite je při buildu zkopíruje do `dist/`.
- `tests/e2e/` přepsané referenční testy (`flows`, `game`, `layout`) a testy vložení (`embed`).

## Jak se chová embed (ověřeno testy)

- Lepicí hlavička se měří za běhu (`data-scroll-offset="auto"`, výchozí): 199, 175 i 119 px na notebooku, 60 px mezi 992 a 1199 px, 0 na mobilu. Číslo v atributu měření přepíše.
- Přepnutí obrazovky posune widget pod hlavičku a dá fokus na nadpis, první vykreslení stránkou neposouvá. Pruh s odznakem a náhled aplikace se odkrývají pod hlavičku, ne pod ni (R3).
- Okno s odznakem a konfety jsou v top layer nad hlavičkou, lištou cookies, poradcem i mobilní lištou. „Znám viníka“ je popover nad dolní lištou webu (měří ji, 70 px).
- Styly Bootstrapu se do widgetu nepropisují a widget nemění stránku. Hash stránky zůstává.

## Co jsem rozhodl při stavbě (ke kontrole, texty se neměnily)

- **Data od dneška (rozhodnutí 19):** rezervace ukazuje tři pracovní dny od zítřka, krok v logu AI má den doplněný („Zkouším rezervaci na středu ve 13:00“), výpis `last` v kyberbezpečnosti má dnešek a včerejšek.
- **Přeskočená hra (rozhodnutí 7):** na kartě úvodu a v „Další práce na zkoušku“ šedé „Přeskočeno“, pruh s odznakem se neukáže.
- **Světlý pruh s odznaky v embedu** je převzatý z dema ze 3. 11. (předloha k němu dosud není, A13, S3).
- **Plátno hry v embedu** se počítá z výšky okna pod hlavičkou webu, na samostatné stránce vyjde stejně jako v prototypu (A3). Kritérium „Hrát bez scrollování“ testuji jen na samostatné stránce.
- **Fokus (A11):** po přepnutí obrazovky na nadpis, v kyberbezpečnosti zůstává v panelu, ve výsledku na tlačítku odpovědi. Po zavření okna s odznakem na „Zkusit další práci“. Ve výsledku je cena a „Co dál“ v DOM před „Další práce“ (S8).
- **Vývojové závislosti navíc:** `@playwright/test` 1.64.1 a `@types/node` 24 (jen pro vývoj a testy, runtime závislost žádná).

## Otevřené otázky pro Ondřeje

- Kapitola 9: hosting (1), adresa nástroje (2), formulář před nástrojem a deal nebo lead (3), DIGIkurzy při spuštění (4), osobní údaje (6).
- **Kurz s `digikurzy: false`:** widget zatím ukáže stejný blok jako s příspěvkem (tedy „Dotace 0 Kč“). Před první změnou na `false` je potřeba rozhodnout text (souvisí s otázkou 4).
- Token `?pnz` je jen na stránce, kam člověk přijde z e-mailu. Na dalších stránkách webu widget nic nezapíše, pokud token neuloží (`sessionStorage` = zásah do hostitele).
- Ubuntu Mono v embedu: přidat do CSS webu, vložit `<link>` do hlavičky (zásah do hostitele), nebo systémový monospace (teď záloha).
- Návrh: po zaškrtnutí školení přes firmu ukázat „Ozveme se ti“ jen tehdy, když je token v odkazu (nový text ke schválení).
- Tabulka spouštěčů analytiky (fáze 4).
- Pouštět Playwright testy i v GitHub Actions před nasazením? Lokálně prochází stabilně, v CI by běžely v Edge na Linuxu.

## Další kroky

1. **Fáze 4:** události do `dataLayer` podle tabulky spouštěčů (ke schválení), odesílání snímku s debounce 2 s a `sendBeacon` jako `text/plain`. Čtení `?pnz` a UTM. Stav pro odeslání dává `host.state` a `buildPayload()`.
2. **Fáze 5:** endpoint v `DRY_RUN`.
3. **Fáze 6:** editor levelu z klávesnice (šipky, Enter, mezerník, číslice z `e.code`), dotykové cíle 44 px, fokus na tmavých plochách. Texty nápovědy ke schválení.

## Prostředí a zvyklosti

- Windows. Terminál v aplikaci je Windows PowerShell 5.1, který nezná `&&`. Bash nástroj ano.
- Node 24 spouští `.ts` přímo. Edge i Chrome jsou nainstalované, Playwright používá `channel: 'msedge'` a prohlížeč nestahuje.
- `.claude/launch.json`: `widget` servíruje `dist/` (vite preview, port 4173), `dev` spouští vite na 5173, `site` servíruje `_site/` na 8765.
- Commity jsou česky a končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Před workflow nebo víc než třemi agenty napsat odhad spotřeby a počkat na souhlas (Ondřejův globální CLAUDE.md). Týdenní limit byl 3. 11. odpoledne na 7 %.
