# Předání: po zjednodušení podle schůzky 4. 11.

Shrnutí ze dne 5. 11. 2026. Zadání zjednodušení je `ZPETNA-VAZBA.md`, schválené texty `NAVRH-TEXTU.md`. Rozhodnutí z dřívějška a jejich důvody jsou v `PLAN.md` (sekce „Rozhodnuto“), podrobné nálezy v `NALEZY.md` (odkazy typu A1, Z6 vedou tam). Původní zadání je `ZADANI.md`, pravidla `CLAUDE.md`.

## Stav

- **Fáze 1 a 2 (sloučená s fází 3) a zjednodušení jsou hotové.** Skutečný widget `<prace-na-zkousku>` s otevřeným Shadow DOM. Hlavní je samostatná stránka (`data-variant="standalone"`), kterou Martin vloží na web přes embed na celou obrazovku. Varianta embed (`data-variant="embed"`, výchozí) a měření hlavičky dál fungují.
- **Testy:** 82 unit testů (Vitest) a 44 Playwright testů v Edge přes `http://localhost` (`npm run test:e2e`), jeden odložený do fáze 6 (`test.fixme`, dotykové cíle 44 px). Typecheck i build jsou čisté, widget má 36,8 kB gzip (cíl 80 kB). Rozložení je ověřené na 390 × 844 i 1366 × 768.
- **Demo:** https://ondrejkamaryt.github.io/prace-na-zkousku/ ukazuje novou verzi. Sestavuje ho `node scripts/build-site.ts` (spustí i `vite build`), nasazuje `.github/workflows/pages.yml` při pushi do `main`. Adresa se nezměnila.

## Co se změnilo proti 3. 11.

- **Odznaky jsou pryč:** pruh, vyzvednutí, okno s konfetami i „Odznaky n/4“. `src/ui/celebrate.ts` je smazaný.
- **Konec ukázky:** krémový pruh s větou a tlačítkem „Můj výsledek“, u kyberbezpečnosti jen tlačítko, protože „Server je v bezpečí“ je hned nad ním. Dole na ukázce i ve výsledku je „Zkus si další příklady“ (ostatní ukázky, hotové odškrtnuté) místo „Zpět na výběr“.
- **Hlavička:** „Můj výsledek“ se ukáže až po první hotové nebo přeskočené ukázce. V embedu je do té doby skrytý celý světlý pruh.
- **Výsledek** je jeden sloupec (nejvýš 720 px): doporučený obor s jednou větou, cena s příspěvkem, „Co dál“ s větou o nové záložce, další příklady. Pryč jsou důvody, „Bavilo tě to?“, „Co od kurzu čekáš?“ a školení přes firmu. Barevně bez modrého bloku.
- **Datová analýza** je klikačka po třech krocích (měsíce, produkty, dny). Na obrazovce je jeden krok, špatná odpověď zmizí s nápovědou, po dvou špatných v kroku se ukáže správná. Konec je „Zmizely víkendové snídaně“. Pryč jsou záložky, pohled podle hodin, útrata a účtenky, plovoucí „Znám viníka“.
- **Kyberbezpečnost:** jeden levý sloupec (zadání, poplach, krok, výsledek), terminál vpravo jako ilustrace, na mobilu pod krokem. Texty beze změny.
- **Hra:** plátno přes celou šířku rámečku. Plocha 12 × 7 a fyzika jsou stejné, na širokém okně je plocha uprostřed a po stranách pokračuje obloha a zem jako kulisa (při úpravách zesvětlená, klepnutí tam nic nedělá). Pořadí je plátno, text, nástroje, tlačítka. Nástroje s ikonou a vysvětlením se ukazují jen při úpravách, takže plátno při přepínání neposkočí. Texty bez slova level.
- **Stavění s AI je schované:** nikde se nenabízí a `?ukazka=ai` ani `data-start="ai"` ji neotevřou. Kód, texty i testy zůstávají.

## Jak vrátit Stavění s AI

Do `offered` v `src/content/config.json` přidat `"ai"`. Pak je potřeba změnit podnadpis úvodu („Tři pětiminutové ukázky“) a rozhodnout, jestli ve výsledku vrátit jiné texty. Atribut `data-ukazky="data ai hry kyber"` nabídku přepíše na jedné stránce, přes něj běží testy AI (`openWithAi` v `tests/e2e/helpers.ts`). Mřížka karet se přizpůsobí počtu ukázek.

## Struktura

- `src/widget.ts` custom element: atributy, nabídka ukázek, navigace bez hashe, posouvání (`reveal`, `alignTop`, `keepVisible`), „Můj výsledek“ v hlavičce, stav na kartách a další příklady. `src/main.ts` ho registruje jen jednou (A15).
- `src/screens/` obrazovky: `start`, `data`, `ai` a `ai-apps`, `game`, `kyber`, `result`. Stav mění jen funkcemi z `src/logic/state.ts`.
- `src/ui/` styly (`styles.css`, `screens.css`, tokeny na `:host`, `@container` místo `@media`), měření hlavičky (`scroll.ts`), sdílené části (`parts.ts`: hlavička úkolu, pruh Hotovo, další příklady) a ikony včetně nástrojů editoru.
- `src/content/cs.json` všechny texty rozhraní, `config.json` nabídka ukázek, ceny a odkazy, `fixtures.ts` technické ukázky (SQL, kód aplikací, výpisy terminálu), na které se typografie nevztahuje.
- `index.html` samostatná stránka (zároveň ukázka pro tým), `test-host.html` napodobenina webu (parametry `?podmenu=56|80|0`, `?start=`, `?offset=`, `?cookies=0`). Vite je při buildu zkopíruje do `dist/`.
- `tests/e2e/` přepsané referenční testy (`flows`, `game`, `layout`) a testy vložení (`embed`).

## Jak se chová embed (ověřeno testy)

- Lepicí hlavička se měří za běhu (`data-scroll-offset="auto"`, výchozí): 199, 175 i 119 px na notebooku, 60 px mezi 992 a 1199 px, 0 na mobilu. Číslo v atributu měření přepíše.
- Přepnutí obrazovky posune widget pod hlavičku a dá fokus na nadpis, první vykreslení stránkou neposouvá. Nový krok dat a výsledek ukázky se srovnají pod hlavičku, „Další krok“ se odkryje nad dolní lištou webu (R3).
- Widget nemá žádnou vrstvu nad stránkou, žádný `<dialog>` ani popover.
- Styly Bootstrapu se do widgetu nepropisují a widget nemění stránku. Hash stránky zůstává.

## Data pro fázi 4 (rozhodnuto 5. 11.)

- „Hotovo“ dál znamená dokončenou ukázku (`status: 'done'`). Stav, snímek pro Pipedrive i hodnocení zůstávají, jen `badgeCount` je pryč.
- V `DataSnap` je místo `viewsSeen` a `tries` nově `mistakes` (špatné odpovědi celkem, 0 až 6), `firstTry` (všechny kroky bez chyby) a `revealed` (správnou aspoň jednou ukázal nástroj). Hodnocení: `revealed` je bad, `firstTry` great, jinak average. Doporučení počítá data jako dřív s prohlédnutými pohledy (2,5 bodu plus 1 za `firstTry`).
- `fav`, `goal` a `firm` zůstávají ve stavu i snímku, ale obrazovka je nenastavuje, takže jsou prázdné. Poznámka pro obchod pak říká „bez odpovědi“ a „neuvedeno“. Ve fázi 4 rozhodnout, jestli ty řádky z poznámky vypustit.
- Poznámka pro obchod má u dat nové věty (`NAVRH-TEXTU.md`), u hry zatím zůstává slovo level, návštěvník ji nevidí.

## Co jsem rozhodl při stavbě (ke kontrole, texty se neměnily)

- **Data od dneška (rozhodnutí 19):** rezervace ukazuje tři pracovní dny od zítřka, výpis `last` v kyberbezpečnosti má dnešek a včerejšek.
- **Přeskočená hra (rozhodnutí 7):** na kartě úvodu a v dalších příkladech šedé „Přeskočeno“, pruh Hotovo se neukáže, „Můj výsledek“ ano.
- **Po dvou špatných v posledním kroku dat** zůstane krok vidět se správnou odpovědí a dál se jde přes „Další krok“. Po správné odpovědi se výsledek ukáže rovnou.
- **Po odhalené odpovědi** je vidět jen „Správná odpověď je označená zeleně.“, věta za správnou odpověď začíná „Správně“ a sem by se nehodila.
- **Plátno hry v embedu** se počítá z výšky okna pod hlavičkou webu, na samostatné stránce vyjde stejně jako v prototypu (A3). Kritérium „Hrát bez scrollování“ testuji jen na samostatné stránce.
- **Fokus (A11):** po přepnutí obrazovky na nadpis, v kyberbezpečnosti zůstává v panelu a na konci přejde na „Můj výsledek“, v datech na nadpis nového kroku.
- **Ilustrace na úvodu** (`HERO_ART`) dál obsahuje malou bublinu s hvězdičkou, která naráží na AI. Nikam nevede, nechal jsem ji.
- **Vývojové závislosti navíc:** `@playwright/test` 1.64.1 a `@types/node` 24 (jen pro vývoj a testy, runtime závislost žádná).

## Otevřené otázky pro Ondřeje

- **Nízký příjem:** zaškrtávátko se u dat, her ani kyberbezpečnosti neukazuje, protože u všech tří platí strop 35 000 Kč a cenu nezmění. Měnilo by ji jen u Stavění s AI. Vysvětlení je dál v rozbalovacím „Jak příspěvek funguje“.
- **`CLAUDE.md`:** věta o neutrálních názvech odznaků je zastaralá a prototyp už není zdroj pravdy pro data, hru a výsledek. Nechal jsem soubor být, stačí říct a upravím ho.
- **Školení přes firmu:** z widgetu zmizelo včetně zájmu pro LifeScale Business. Odkaz `skoleniFirmy` v `config.json` zůstal nepoužitý pro případ návratu.
- Kapitola 9: hosting (1), adresa nástroje (2), formulář před nástrojem a deal nebo lead (3), DIGIkurzy při spuštění (4), osobní údaje (6).
- **Kurz s `digikurzy: false`:** widget zatím ukáže stejný blok jako s příspěvkem (tedy „Dotace 0 Kč“). Před první změnou na `false` je potřeba rozhodnout text (souvisí s otázkou 4).
- Token `?pnz` je jen na stránce, kam člověk přijde z e-mailu. Na dalších stránkách webu widget nic nezapíše, pokud token neuloží (`sessionStorage` = zásah do hostitele).
- Ubuntu Mono v embedu: přidat do CSS webu, vložit `<link>` do hlavičky (zásah do hostitele), nebo systémový monospace (teď záloha).
- Tabulka spouštěčů analytiky (fáze 4).
- Pouštět Playwright testy i v GitHub Actions před nasazením? Lokálně prochází stabilně, v CI by běžely v Edge na Linuxu.

## Další kroky

0. **Mimo kód:** Ondřej pošle Martinovi adresu dema. Martin ji vloží na web přes embed na celou obrazovku a na stránky kurzů dá bannery s `?ukazka=data`, `?ukazka=kyber` a `?ukazka=hry`. Pak změřit, jestli to přináší leady.
1. **Fáze 4:** události do `dataLayer` podle tabulky spouštěčů (ke schválení), odesílání snímku s debounce 2 s a `sendBeacon` jako `text/plain`. Čtení `?pnz` a UTM. Stav pro odeslání dává `host.state` a `buildPayload()`.
2. **Fáze 5:** endpoint v `DRY_RUN`.
3. **Fáze 6:** editor hry z klávesnice (šipky, Enter, mezerník, číslice z `e.code`), dotykové cíle 44 px, fokus na tmavých plochách. Texty nápovědy ke schválení.

## Prostředí a zvyklosti

- Windows. Terminál v aplikaci je Windows PowerShell 5.1, který nezná `&&`. Bash nástroj ano.
- Node 24 spouští `.ts` přímo. Edge i Chrome jsou nainstalované, Playwright používá `channel: 'msedge'` a prohlížeč nestahuje.
- `.claude/launch.json`: `widget` servíruje `dist/` (vite preview, port 4173), `dev` spouští vite na 5173, `site` servíruje `_site/` na 8765.
- Commity jsou česky a končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Před workflow nebo víc než třemi agenty napsat odhad spotřeby a počkat na souhlas (Ondřejův globální CLAUDE.md).
