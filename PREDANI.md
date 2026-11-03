# Předání: fáze 2 (widget jako embed)

Shrnutí pro novou session ze dne 3. 11. 2026. Rozhodnutí a jejich důvody jsou v `PLAN.md` (sekce „Rozhodnuto“), podrobné nálezy s doklady v `NALEZY.md` (odkazy typu A1, Z6 vedou tam). Zadání je `ZADANI.md`, pravidla `CLAUDE.md`.

## Cíl

Postavit skutečný widget `<prace-na-zkousku>` se Shadow DOM. **Primární je vložení do stránky webu** (`data-variant="embed"`), samostatná stránka je druhotná. Proto se fáze 2 a 3 z plánu slučují: obrazovky se rovnou staví pro embed a k nim vznikne `test-host.html` věrně napodobující coderslab.cz. Na GitHub Pages pak demo ukáže skutečný widget místo prototypu.

## Stav

- **Fáze 1 je hotová:** kostra (Vite 8 v library mode, TypeScript 7, Vitest 5), `src/content/cs.json` a `config.json`, logika bez DOM v `src/logic/`, 78 unit testů. Typecheck i testy prochází.
- **Repo:** https://github.com/OndrejKamaryt/prace-na-zkousku (veřejné, větev `main`). Každý push do `main` spustí `.github/workflows/pages.yml`: typecheck, testy a nasazení.
- **Demo:** https://ondrejkamaryt.github.io/prace-na-zkousku/ ukazuje prototyp vložený do napodobeniny coderslab.cz. Sestavuje ho `scripts/build-site.ts`, včetně schválených změn textů (výčet `APPROVED`). Původní prototyp je na `/prototyp.html`.
- `src/main.ts` je zatím prázdný vstupní bod.

## Logika, na kterou se obrazovky napojí (`src/logic/state.ts`)

Obrazovky stav nemění samy, volají tyto funkce (čas `now` předávají zvenku):

- `openPath(s, k, now)` při otevření ukázky (běží čas, stav se nemění), `touch` volají akce samy.
- Data: `viewData(s, view, now, initial)`, `answerData(s, correct, now)`, který vrací `wrong | solved | revealed | ignored`. Po 3 chybách odhalí odpověď.
- AI: `startIdea`, `ideaBuilt` (až aplikace stojí), `changeApplied(s, idea, changeId, now)` (až po provedení úpravy, vrací true při prvním odznaku).
- Hra: `gamePlay(s, own, now)`, `gameDeath`, `gameEdit`, `gameWin(s, own, coins, now)`, `gameSkip`. Přeskočení nedává odznak (status `skipped`).
- Kyber: `kyberAnswer(s, correct, firstTry, now)`, na konci `finish(s, 'kyber', now)`.
- Výsledek: `setFav` (`'not:klíč'` pro „Spíš ne“), `setGoal`, `setFirm`, `lowIncomeShown`, `setLowIncome`.
- `snapshot()`, `recommend()`, `why()`, `rate()`, `priceFor()`, `lowIncomeMatters()`, `opener()`, `noteRows()`. Payload skládá `buildPayload(s, {token, session, seq, utm}, now)`.

## Co hlídat při stavbě (ověřeno v prověrce)

- **Shadow DOM:** posluchače na `shadowRoot`, ne na `document`, protože `e.target` se přesměruje na hostitele (Z6, A4). Past fokusu přes `shadowRoot.activeElement`. Tokeny z `:root` přesunout na `:host`. Font, `line-height` a barva z `body` webu do stínu projdou, `:host` je musí nastavit (A8). `attachShadow({mode: 'open'})`, jinak na to Playwright nedosáhne.
- **Překryvy:** okno s odznakem jako `<dialog>` přes `showModal()` (top layer), konfety uvnitř dialogu, plovoucí tlačítko přes `popover`. z-index 2000 na webu nestačí: ikona poradce má 5000, mobilní dolní lišta 70 px (A1, E12).
- **Posouvání:** `data-scroll-offset="auto"` změří lepicí hlavičku za běhu. Na webu má 199 px na stránce kurzu, 118 px bez podmenu a pod 992 px 0 (A2, E2). Při prvním vykreslení stránkou neposouvat (V2-1). Cílům `reveal()` dát `scroll-margin-top`.
- **@container:** `container-type` v Edge nevytváří containing block pro `position: fixed`, problém není. Pozor jen na hostitele v úzkém rodiči (A7).
- **Písma:** v embedu se nenačítají. Ubuntu Mono web nemá a `@font-face` ve shadow root nefunguje (A9, E1). Otázka pro Ondřeje, zatím systémový monospace jako záloha.
- **Hra:** plátno inicializovat až při otevření ukázky. Klávesnice jen s fokusem na plátně, číslice číst z `e.code` (česká klávesnice) (A10). Smyčku zastavit, když je obrazovka skrytá.
- **Testy:** ES modul se přes `file://` nenačte, takže Playwright musí běžet přes `http://localhost` (webServer). Referenční testy z `referencni-testy/` přepsat do TypeScriptu se skutečnými assercemi (R1, R6). `@playwright/test` jako vývojová závislost, prohlížeč nestahovat a použít `channel: 'msedge'`.
- **Texty:** do `cs.json`, pevné mezery doplní `npm run typo:fix`. Schválené změny z `APPROVED` v `build-site.ts` převzít do `cs.json`.

## Otevřené otázky pro Ondřeje

- Kapitola 9: hosting (1), adresa nástroje (2), formulář před nástrojem a deal nebo lead (3), DIGIkurzy při spuštění (4), osobní údaje (6).
- Token `?pnz` je jen na stránce, kam člověk přijde z e-mailu. Na dalších stránkách webu widget nic nezapíše, pokud token neuloží (`sessionStorage` = zásah do hostitele).
- Ubuntu Mono v embedu: přidat do CSS webu, vložit `<link>` do hlavičky (zásah do hostitele), nebo systémový monospace.
- Návrh: po zaškrtnutí školení přes firmu ukázat „Ozveme se ti“ jen tehdy, když je token v odkazu (nový text ke schválení).
- Tabulka spouštěčů analytiky (fáze 4).

## Prostředí a zvyklosti

- Windows. Terminál v aplikaci je Windows PowerShell 5.1, který nezná `&&`. Bash nástroj ano.
- Node 24 spouští `.ts` přímo (`node scripts/....ts`). Python 3.12 je bez Playwrightu. Edge i Chrome jsou nainstalované.
- `.claude/launch.json` obsahuje konfiguraci `site`, která servíruje `_site/` na portu 8765. `node scripts/build-site.ts` web nejdřív sestaví.
- Commity jsou česky a končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `git push` funguje. Založení repa minule zablokovala bezpečnostní kontrola.
- Před workflow nebo víc než třemi agenty napsat odhad spotřeby a počkat na souhlas (Ondřejův globální CLAUDE.md). Týdenní limit byl 3. 11. na 4 %.
- Ondřej má zapnutý výstupní styl Learning: u větších návrhových rozhodnutí ho požádat o krátký kousek kódu (`TODO(human)`).
