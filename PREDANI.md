# Předání: po zjednodušení podle schůzky 4. 11.

Shrnutí ze dne 5. 11. 2026, IT admin je přepracovaný 12. 11. podle Martinova zadání UX (sekce níže). Zadání zjednodušení je `ZPETNA-VAZBA.md`, schválené texty `NAVRH-TEXTU.md`. Rozhodnutí z dřívějška a jejich důvody jsou v `PLAN.md` (sekce „Rozhodnuto“), podrobné nálezy v `NALEZY.md` (odkazy typu A1, Z6 vedou tam). Původní zadání je `ZADANI.md`, pravidla `CLAUDE.md`.

## Stav

- **Fáze 1 a 2 (sloučená s fází 3) a zjednodušení jsou hotové.** Skutečný widget `<prace-na-zkousku>` s otevřeným Shadow DOM. Hlavní je samostatná stránka (`data-variant="standalone"`), kterou Martin vloží na web přes embed na celou obrazovku. Varianta embed (`data-variant="embed"`, výchozí) a měření hlavičky dál fungují.
- **Testy:** 93 unit testů (Vitest) a 59 Playwright testů v Edge přes `http://localhost` (`npx playwright test`), jeden odložený do fáze 6 (`test.fixme`, dotykové cíle 44 px). Typecheck i build jsou čisté, widget má 52 kB gzip (cíl 80 kB). Rozložení je ověřené na 390 × 844, 1366 × 768 a u IT admina i na 1366 × 720.
- **Demo:** https://ondrejkamaryt.github.io/prace-na-zkousku/ ukazuje novou verzi. Sestavuje ho `node scripts/build-site.ts` (spustí i `vite build`), nasazuje `.github/workflows/pages.yml` při pushi do `main`. Adresa se nezměnila. GitHub Pages posílá `max-age=600` a skript se jmenuje pořád stejně, proto ho `_site/index.html` načítá s otiskem `?v=…`: po nasazení stačí obnovit stránku.

## Co se změnilo proti 3. 11.

- **Odznaky jsou pryč:** pruh, vyzvednutí, okno s konfetami i „Odznaky n/4“. `src/ui/celebrate.ts` je smazaný.
- **Konec ukázky:** krémový pruh s větou a tlačítkem „Můj výsledek“. Dole na ukázce i ve výsledku je „Zkus si další příklady“ (ostatní ukázky, hotové odškrtnuté) místo „Zpět na výběr“.
- **Hlavička:** „Můj výsledek“ se ukáže až po první hotové nebo přeskočené ukázce. Na obrazovce IT admina se neukazuje, tam vede dál „Co dál?“ na výsledkové kartě (12. 11.). V embedu je do té doby skrytý celý světlý pruh.
- **Výsledek** je jeden sloupec (nejvýš 720 px): doporučený obor s jednou větou, cena s příspěvkem, „Co dál“ s větou o nové záložce, další příklady. Pryč jsou důvody, „Bavilo tě to?“, „Co od kurzu čekáš?“ a školení přes firmu. Barevně bez modrého bloku.
- **Datová analýza** je práce analytika v osmi rozhodnutích: Jana napíše o problému, návštěvník stáhne data z pokladny, sečte měsíce, klikne na březen, porovná dny, klikne na víkend, rozdělí tržby podle produktů, klikne na snídaně a napíše Janě závěr. Jeviště mění barvu podle fáze (krémová, tmavá, modrá, žlutá), tlačítka a sloupce svítí, nad jevištěm se plní tři stopy a nad grafy se vypisuje dotaz SQL. Špatná volba zmizí a Jana k ní řekne svoje, po dvou špatných se rozsvítí správná, na kterou se klikne. Konec je „Zmizely víkendové snídaně“ a 52 800 Kč. Klikací koncept je v `prototyp/data-koncept.html`.
- **IT administrátor (kyberbezpečnost):** noční velín na serveru pekárny Kvásek, Tereza a Petra jsou vymyšlené postavy. Ondřej 8. 11. rozhodl, že ukázka zůstává na příkladu pekárny, ne na serverech Coders Labu. Od 12. 11. je přestavěný podle Martinova zadání UX, viz sekce „IT admin podle Martinova zadání UX“. Koncept v `prototyp/admin-koncept.html` je starší, platí texty v `NAVRH-TEXTU.md`.
- **Hra:** běží se z Coders Labu do herního studia, postavička je žlutý čtverec s očima, sbírají se mince a uhýbá se bodcům. Coders Lab zůstává jen v podnadpisu. Živé bugy, cedule, sbírání kódu a logo CL na postavičce z konceptu Ondřej 8. 11. vyřadil, koncept je má ještě v sobě. Plátno má celou šířku rámečku, plocha 12 × 7 a fyzika jsou stejné, na širokém okně je plocha uprostřed a po stranách pokračuje město a zem jako kulisa (při úpravách zesvětlená, klepnutí tam nic nedělá). Přibyly tři životy v první fázi, body, rekord, hvězdy za běh, výzvy herního designéra a nástroj trampolína. Po první výhře se do úprav nejde samo: karta ukáže hvězdy a svítí „Upravit hru“. Po třetím pádu se editor otevře sám. Řádek „Pokusy, úpravy“ je pryč. Koncept je v `prototyp/hra-koncept.html`, platí ale texty v `NAVRH-TEXTU.md`.
- **Hvězdy a body nejsou odznaky:** žijí jen v obrazovce ukázky, nejsou v hlavičce ani ve výsledku a neposílají se do Pipedrivu. Ve fázi 4 se dá rozhodnout, jestli je obchod chce vidět.
- **Stavění s AI je schované:** nikde se nenabízí a `?ukazka=ai` ani `data-start="ai"` ji neotevřou. Kód, texty i testy zůstávají.

## IT admin podle Martinova zadání UX (12. 11.)

Podklad je Martinovo `Zadani_UX_hra_kyberbezpecnost.pdf` (UX-01 až UX-12), postup a texty schválil Ondřej 12. 11. v `NAVRH-KYBER-UX.md`, texty jsou i v `NAVRH-TEXTU.md`. Data, hra a ceny se nemění.

- **Stavový automat** (`src/screens/kyber.ts`): úvod, krok 1 až 3, výsledek (`data-step` na `#s-stage`). Kroky se skládají z taktů a každý takt má fáze zpráva, otázka, volby a zpětná vazba (`data-phase` na `#s-step`). Terezina zpráva se nejdřív „píše“, pak je pauza 400 ms, otázka a volby. Volby se vykreslí na místě, kde se pak klikají, a do konce zprávy jsou vypnuté.
- **Jeden stav hry** (`src/logic/kyber.ts`): pokusy podle adresy, zabezpečení v procentech, chyby v krocích, čas a z nich hvězdy. Přehled, karty adres i výpis `uniq -c` v terminálu (`src/content/fixtures.ts`) berou čísla odsud. Útočníkovi od 412 přibývá asi 7 pokusů za sekundu, příkaz „Spočítat“ číslo zastaví. Penalizace +25 pokusů za špatnou adresu je pryč.
- **Úvod přes herní box** se „Začít zásah“. Čas i útok na mapě běží až po startu, při skryté záložce (`visibilitychange`) a mimo obrazovku IT admina stojí. Po startu se stránka posune na herní box.
- **Rozložení:** nahoře zabezpečení, čas, pokusy a hvězdy. Vlevo chat s pevnou výškou 120 px (poslední 3 zprávy, nejnovější bílá dole, jméno jen u ní) a oblast kroku. Vpravo mapa s legendou (40 %) a terminál (60 %), který se posouvá na poslední příkaz a nový výpis 1,5 s zvýrazní. Na mobilu přehled, chat, krok, sbalitelný terminál na 6 řádků a zmenšená mapa.
- **Příkazy:** jediná akce v kroku je plné žluté tlačítko, vedle něj ⓘ s vysvětlením (klepnutím, jde i z klávesnice), po spuštění shrnutí pod tlačítkem. Shrnutí zůstane nad dalším pokynem ve stejném kroku, ať nezmizí. Volby jsou obrysové karty, červená je jen chyba.
- **Chyba:** volba červeně s ✕, pod ní vysvětlení a „Zkusit znovu“. První chyba za hru vezme hvězdu za rozhodnutí napoprvé. Po „Zkusit znovu“ zůstane špatná volba označená a vypnutá, u štítů se špatné odeberou a správné zůstanou vybrané.
- **Krok 3:** „Vybráno n/2“, „Nasadit štíty“ jde až při dvou, třetí výběr nejde a ukáže se hláška.
- **Hvězdy:** za ubráněný server, za rozhodnutí napoprvé (pryč při první chybě) a za rychlost (pryč po 2:00). Vidět jsou v přehledu po celou hru i s počtem „n/3“.
- **Výsledková karta** v herním boxu místo pruhu Hotovo: Tereza, „Server je v bezpečí“, hvězdy a „n/3“, čas zásahu, pevná věta „Pod 1 minutu to zvládne jen každý třetí.“, čtyři dovednosti, věta o kurzu a tlačítka „Co dál?“ (vede na doporučení s cenou), „Zahrát znovu“ a „Sdílet výsledek“. „Můj výsledek“ v hlavičce je na obrazovce IT admina schovaný, u dat a hry zůstává.
- **Zahrát znovu** začne rovnou krokem 1. Do stavu návštěvníka (a do Pipedrivu) se počítá jen první hra: `kyberAnswer` a `finish` se při opakování nevolají.
- **Sdílet výsledek:** na dotykovém zařízení systémové sdílení (`navigator.share`), na počítači kopie textu s odkazem do schránky a „Odkaz je zkopírovaný.“ Když iframe sdílení nepovolí, odkaz se zkopíruje. V iframe bez povolení schránky se kopíruje starší cestou přes výběr textu.
- **„2 minuty“** jen u IT admina: štítek nad nadpisem, karta na úvodu a „asi 2 minuty“ v dalších příkladech (`duration()` v `src/ui/parts.ts`). Perex nad hrou je kratší.
- **Přístupnost:** chat je `role="log"`, shrnutí a vysvětlení hlásí čtečce skrytá oblast `aria-live`. Fokus jde po startu a po každém kroku na oblast kroku (čtečka přečte otázku, Tab vede na první volbu), po chybě na „Zkusit znovu“, na konci na „Server je v bezpečí“. Tlačítka mají aspoň 44 px, text v IT adminovi kontrast aspoň 4,5 : 1 i po najetí myší (test C3). Bez animací se netočí prstence, nepulzují a nelétají tečky.

## Analytika IT admina (pro Martina)

Ukázka vyvolá každou událost jako `CustomEvent('prace-na-zkousku')` na prvku widgetu (probublá až na `document`) a když běží v iframe, pošle ji i stránce nad sebou přes `window.parent.postMessage`. Nesbírá a neposílá žádné osobní údaje ani cookies, jen názvy událostí, čísla kroků, sekundy a klíče voleb. Kód je v `src/ui/track.ts`, testy v `tests/e2e/embed.spec.ts` (iframe) a `tests/e2e/kyber.spec.ts`.

Každá zpráva má `source: 'prace-na-zkousku'`, `event` a `game: 'kyber'`. Pořadí ověřuje test „analytika“.

| Událost | Kdy | Data navíc |
|---|---|---|
| `game_view` | obrazovka IT admina se ukáže | |
| `game_start` | „Začít zásah“ nebo „Zahrát znovu“ | `replay` |
| `wrong_answer` | špatná volba | `step`, `option` (IP adresa nebo klíč volby: `smazat`, `nic`, `vypinat`, `prejmenovat`), `replay` |
| `step_complete` | krok 1, 2 nebo 3 je hotový | `step`, `time` (sekundy od startu), `wrong_count`, `replay` |
| `game_finish` | server je zabezpečený | `stars`, `time`, `replay` |
| `result_cta_click` | „Co dál?“ | |
| `replay_click` | „Zahrát znovu“ | |
| `webinar_click` | „Webinář zdarma“ na stránce s doporučením, jen když doporučuje kyberbezpečnost | |
| `course_detail_click` | „Detail kurzu“ tamtéž, za stejné podmínky | |

`replay: true` znamená opakovanou hru, pro konverzi stačí první hry (`replay: false`).

Vložení přes iframe na web Coders Labu. `allow` povolí sdílení na telefonu a kopii do schránky:

```html
<iframe src="https://ondrejkamaryt.github.io/prace-na-zkousku/index.html?ukazka=kyber"
        title="Práce na zkoušku" allow="clipboard-write; web-share"
        style="width:100%; height:100vh; border:0"></iframe>
```

Posluchač na stránce webu, který události přepošle do GTM:

```html
<script>
  window.dataLayer = window.dataLayer || [];
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://ondrejkamaryt.github.io') return;
    var d = e.data;
    if (!d || d.source !== 'prace-na-zkousku') return;
    window.dataLayer.push({
      event: d.event,
      pnz_game: d.game,
      pnz_step: d.step,
      pnz_time: d.time,
      pnz_wrong_count: d.wrong_count,
      pnz_option: d.option,
      pnz_stars: d.stars,
      pnz_replay: d.replay
    });
  });
</script>
```

Když se widget vloží přímo jako `<prace-na-zkousku>` (bez iframe), stačí místo `message` poslouchat `document.addEventListener('prace-na-zkousku', function (e) { var d = e.detail; … })`. Posluchač musí být na stránce dřív, než se načte skript widgetu, jinak mu uteče `game_view`.

## Jak vrátit Stavění s AI

Do `offered` v `src/content/config.json` přidat `"ai"`. Pak je potřeba změnit podnadpis úvodu („Tři krátké ukázky“) a rozhodnout, jestli ve výsledku vrátit jiné texty. Atribut `data-ukazky="data ai hry kyber"` nabídku přepíše na jedné stránce, přes něj běží testy AI (`openWithAi` v `tests/e2e/helpers.ts`). Mřížka karet se přizpůsobí počtu ukázek.

## Struktura

- `src/widget.ts` custom element: atributy, nabídka ukázek, navigace bez hashe, posouvání (`reveal`, `alignTop`, `keepVisible`), „Můj výsledek“ v hlavičce, stav na kartách a další příklady. `src/main.ts` ho registruje jen jednou (A15).
- `src/screens/` obrazovky: `start`, `data`, `ai` a `ai-apps`, `game`, `kyber`, `result`. Stav mění jen funkcemi z `src/logic/state.ts`. Hra IT admina má vlastní stav v `src/logic/kyber.ts` (do stavu návštěvníka nejde), analytiku posílá `src/ui/track.ts`.
- `src/ui/` styly (`styles.css`, `screens.css`, tokeny na `:host`, `@container` místo `@media`), měření hlavičky (`scroll.ts`), sdílené části (`parts.ts`: hlavička úkolu, pruh Hotovo, další příklady) a ikony včetně nástrojů editoru.
- `src/content/cs.json` všechny texty rozhraní, `config.json` nabídka ukázek, ceny a odkazy, `fixtures.ts` technické ukázky (SQL, kód aplikací, výpisy terminálu), na které se typografie nevztahuje.
- `index.html` samostatná stránka (zároveň ukázka pro tým), `test-host.html` napodobenina webu (parametry `?podmenu=56|80|0`, `?start=`, `?offset=`, `?cookies=0`). Vite je při buildu zkopíruje do `dist/`.
- `tests/e2e/` přepsané referenční testy (`flows`, `game`, `layout`), testy vložení a analytiky (`embed`) a QA scénáře IT admina z Martinova zadání (`kyber`).

## Jak se chová embed (ověřeno testy)

- Lepicí hlavička se měří za běhu (`data-scroll-offset="auto"`, výchozí): 199, 175 i 119 px na notebooku, 60 px mezi 992 a 1199 px, 0 na mobilu. Číslo v atributu měření přepíše.
- Přepnutí obrazovky posune widget pod hlavičku a dá fokus na nadpis, první vykreslení stránkou neposouvá. Nový graf dat a výsledek ukázky se srovnají pod hlavičku, volby se odkryjí nad dolní lištou webu (R3).
- Widget nemá žádnou vrstvu nad stránkou, žádný `<dialog>` ani popover.
- Styly Bootstrapu se do widgetu nepropisují a widget nemění stránku. Hash stránky zůstává.

## Data pro fázi 4 (rozhodnuto 5. 11.)

- „Hotovo“ dál znamená dokončenou ukázku (`status: 'done'`). Stav, snímek pro Pipedrive i hodnocení zůstávají, jen `badgeCount` je pryč.
- V `DataSnap` je místo `viewsSeen` a `tries` nově `mistakes` (špatné volby celkem, 0 až 16: osm rozhodnutí, u každého nejvýš dvě), `firstTry` (všechny kroky bez chyby) a `revealed` (správnou aspoň jednou ukázal nástroj). Hodnocení: `revealed` je bad, `firstTry` great, jinak average. Doporučení počítá data jako dřív s prohlédnutými pohledy (2,5 bodu plus 1 za `firstTry`).
- `fav`, `goal` a `firm` zůstávají ve stavu i snímku, ale obrazovka je nenastavuje, takže jsou prázdné. Poznámka pro obchod pak říká „bez odpovědi“ a „neuvedeno“. Ve fázi 4 rozhodnout, jestli ty řádky z poznámky vypustit.
- Poznámka pro obchod má u dat nové věty (`NAVRH-TEXTU.md`), u hry zatím zůstává slovo level, návštěvník ji nevidí.

## Co jsem rozhodl při stavbě (ke kontrole, texty se neměnily)

- **Data od dneška (rozhodnutí 19):** rezervace ukazuje tři pracovní dny od zítřka, výpis `last` v kyberbezpečnosti má dnešek a včerejšek.
- **Přeskočená hra (rozhodnutí 7):** na kartě úvodu a v dalších příkladech šedé „Přeskočeno“, pruh Hotovo se neukáže, „Můj výsledek“ ano.
- **Po dvou špatných volbách v datech** se u tlačítek i v grafu ostatní volby vypnou a správná se rozsvítí. Dál se jde až kliknutím na ni, „Další krok“ v ukázce není. Ukázka je hotová hned po poslední správné volbě, výsledek a pruh Hotovo se ukážou po Janině odpovědi.
- **Po odhalené odpovědi** je vidět jen „Správná odpověď je označená zeleně.“, věta za správnou odpověď začíná „Správně“ a sem by se nehodila.
- **Plátno hry v embedu** se počítá z výšky okna pod hlavičkou webu, na samostatné stránce vyjde stejně jako v prototypu (A3). Kritérium „Hrát bez scrollování“ testuji jen na samostatné stránce.
- **Fokus (A11):** po přepnutí obrazovky na nadpis, v kyberbezpečnosti zůstává v herním boxu a na konci přejde na „Server je v bezpečí“, ve hře po výhře na „Upravit hru“ nebo „Hrát znovu“, v datech na další otázku a na konci na výsledek ukázky.
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
- **Prázdný výsledek mluví o pěti minutách:** „Vyber si jednu práci, zabere asi pět minut.“ IT admin má teď 2 minuty. Návrh: „zabere pár minut“. Podnadpis úvodu je od 12. 11. „Tři krátké ukázky skutečné práce.“
- **Odkaz ke sdílení:** je to adresa stránky, kde ukázka běží, s `?ukazka=kyber`. V iframe tedy vede na demo na GitHub Pages. Chce Martin raději odkaz na stránku webu Coders Labu? Pak by se adresa dala do `config.json`.
- **Srovnání s hráči** je pevná věta „Pod 1 minutu to zvládne jen každý třetí.“ Až bude z analytiky dost `game_finish`, dá se nahradit skutečným číslem.
- **Slovo „Terminál“** na sbalovací liště terminálu na mobilu je z Martinova nákresu F, v textech ke schválení nebylo. Stačí říct, jestli může zůstat.
- Pouštět Playwright testy i v GitHub Actions před nasazením? Lokálně prochází stabilně, v CI by běžely v Edge na Linuxu.

## Další kroky

- **Hotovo 12. 11.: IT admin podle Martinova zadání UX** (viz sekce výše). Martin potřebuje k nasazení na web: iframe s `allow="clipboard-write; web-share"` a posluchač `message`, který posílá události do `dataLayer` (ukázka kódu je výše v sekci o analytice).

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
