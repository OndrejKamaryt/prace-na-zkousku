# Zadání: Práce na zkoušku, widget pro coderslab.cz

## 1. O co jde

Coders Lab nahrazuje na webu starý talentový test novým lead magnetem **Práce na zkoušku**. Návštěvník si vyzkouší jednu až čtyři pětiminutové ukázky skutečné práce (Datová analýza, Stavění s AI, Tvorba her, Kyberbezpečnost), za každou dostane odznak a na konci vidí doporučený směr, cenu kurzu s příspěvkem z programu DIGIkurzy a další krok (webinář, minikurz, konzultace).

Tvým úkolem je z hotového prototypu udělat **produkční widget, který se dá vložit do libovolné stránky na coderslab.cz**, a napojit ho na Pipedrive Coders Labu, aby obchod viděl, co člověk v nástroji dělal.

Nástroj **nesbírá kontakt**. Člověk přijde z předchozího kroku (formulář v reklamě nebo na webu), kde kontakt už nechal, a v odkazu má token. Výsledky z nástroje se k jeho dealu jen připíšou.

## 2. Zdroj pravdy

- `prototyp/prace-na-zkousku.html` je hotový a otestovaný prototyp v jednom souboru (HTML, CSS, JS). **Texty, chování, herní fyzika, level, ceny i vzhled se přebírají z něj 1:1.** Když si nejsi jistý, jak se má něco chovat, otevři prototyp v prohlížeči a udělej to stejně.
- `prototyp/screenshoty/` jsou referenční snímky na mobilu (390 × 844) a notebooku (1366 × 768). Výsledek se jim má vizuálně shodovat.
- `referencni-testy/` jsou Playwright skripty (Python), kterými jsem prototyp testoval. Popisují toky a hraniční případy. Přepiš je do testů nového projektu.

Z prototypu se **nepřebírá**:
- panel „Pohled obchodníka“ ve výsledku (byl jen ukázka pro tým, jeho obsah se teď posílá do Pipedrivu),
- štítek „Prototyp“ a poznámka v patičce,
- tmavá hlavička s logem v režimu `embed` (na webu je hlavička webu). V samostatné stránce zůstává.

## 3. Forma: Web Component se Shadow DOM

Rozhodnutí: **žádný iframe**. Widget je custom element `<prace-na-zkousku>` se Shadow DOM, dodaný jako jeden JS soubor.

Důvody: okno s odznakem, plovoucí tlačítko „Znám viníka“ a konfety jsou `position: fixed` a v iframe s automatickou výškou by se ukazovaly mimo obrazovku. Shadow DOM zároveň oddělí styly od Bootstrapu na coderslab.cz v obou směrech.

Vložení na stránku:

```html
<prace-na-zkousku data-variant="embed" data-start="start"></prace-na-zkousku>
<script type="module" src="https://HOSTING/prace-na-zkousku.js"></script>
```

Atributy:
- `data-variant`: `embed` (bez vlastní hlavičky, ukazatel odznaků jako světlý pruh nahoře ve widgetu) nebo `standalone` (celá stránka jako prototyp, s tmavou hlavičkou a logem).
- `data-start`: `start`, `data`, `ai`, `hry`, `kyber`. Na stránce kurzu se tak dá otevřít rovnou příslušná ukázka.
- `data-api`: URL endpointu pro výsledky (viz kapitola 4). Bez něj widget nic neodesílá.
- `data-scroll-offset`: výška lepicí hlavičky webu v px, výchozí 176 (na coderslab.cz je to růžový pruh 60 px, tmavé menu 59 px a světlé podmenu 56 px). Při přepnutí obrazovky se widget posune na svůj začátek o tento odstup, ne na začátek stránky.

Z URL stránky widget čte:
- `?ukazka=data|ai|hry|kyber` (má přednost před `data-start`, kvůli odkazům z reklam),
- `?pnz=TOKEN` (token leadu, viz kapitola 4),
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.

Pravidla pro embed:
- **Nesahat na `location.hash` hostitelské stránky.** Prototyp přepíná obrazovky přes hash, widget musí mít vlastní interní stav. Tlačítko prohlížeče Zpět se řešit nemusí, obrazovky mají vlastní „Zpět na výběr“.
- Rozložení řídit podle šířky widgetu, ne okna: `@container` místo `@media` všude, kde layout závisí na šířce (widget může být v užším sloupci).
- Překryvy (okno s odznakem, plovoucí tlačítko, konfety) mají `z-index` aspoň 2000, aby byly nad lepicí hlavičkou webu (Bootstrap navbar má 1030), lištou cookies i okénkem poradce vpravo dole.
- Písma Ubuntu a Open Sans web už načítá. `@font-face` uvnitř Shadow DOM v některých prohlížečích nefunguje, takže v režimu `embed` se písma nenačítají znovu. Samostatná stránka je načte z Google Fonts jako prototyp.
- Hra (canvas) se inicializuje až při otevření ukázky Tvorba her, ne při načtení stránky.

Výstupy buildu:
1. `dist/prace-na-zkousku.js`, ES modul s custom elementem, cíl do 80 kB gzip.
2. `dist/index.html`, samostatná stránka (`data-variant="standalone"`) pro přímý provoz z reklam.
3. `dist/test-host.html`, testovací stránka, která napodobuje coderslab.cz: Bootstrap 5 CSS, lepicí hlavička 176 px, lišta cookies dole a widget uprostřed obsahu. Na ní běží testy embedu.

Technologie: TypeScript a Vite v library mode, bez frameworku (prototyp je čisté JS a stačí ho rozdělit do modulů). Lit je povolený, jen když to zdůvodníš. Žádné další runtime závislosti.

## 4. Data do Pipedrivu

### Jak se párují výsledky s člověkem
1. Formulář před nástrojem (reklama nebo web) při vytvoření dealu vygeneruje náhodný token (UUID v4) a uloží ho do nového pole dealu **PNZ token**.
2. Odkaz do nástroje, třeba v děkovací stránce nebo e-mailu po formuláři, vypadá takto: `https://coderslab.cz/cz/prace-na-zkousku?pnz=TOKEN&utm_source=...`
3. Widget posílá výsledky s tímto tokenem na endpoint. Endpoint najde deal podle pole PNZ token a aktualizuje ho.

Bez tokenu se do Pipedrivu nic nezapisuje, posílá se jen analytika (kapitola 5).

Napojení formuláře, který token vytváří, není součást widgetu. Připrav ale přesný popis (README), co má formulář udělat, a pomocnou funkci na vygenerování tokenu.

### Endpoint
- `POST /api/pnz`, serverless funkce nebo malý server. Kde poběží, je otevřená otázka (kapitola 9), napiš ho tak, aby šel nasadit na Netlify, Vercel i jako Node server.
- Pipedrive API token jen v proměnné prostředí `PIPEDRIVE_API_TOKEN` na serveru, **nikdy v prohlížeči**.
- CORS jen pro `https://www.coderslab.cz` a `https://coderslab.cz` (plus localhost při vývoji).
- Validace přes schéma, přijímat jen známá pole, omezit velikost těla na 10 kB, omezit počet požadavků na token a IP.
- Idempotence: widget posílá vždy celý aktuální snímek stavu a endpoint pole přepisuje. Poznámku na dealu aktualizuje (jedna poznámka „Práce na zkoušku“ na deal, ne nová při každém odeslání). Aktivitu zakládá jen jednou.
- Režim `DRY_RUN=1`, který místo zápisu do Pipedrivu jen zaloguje, co by zapsal. **Do skutečného Pipedrivu nic nezapisuj, dokud to Ondřej neschválí.**

Kdy widget posílá: po vyzvednutí každého odznaku, po zobrazení výsledku a při změně odpovědí ve výsledku (co bavilo nejvíc, cíl, školení přes firmu, nízkopříjmová skupina). S debounce 2 s, při zavírání stránky přes `navigator.sendBeacon`. Ten neumí CORS preflight, takže posílá tělo jako `text/plain` a endpoint ho musí přijmout i v tomto tvaru.

Payload:

```json
{
  "token": "3f9c0e7a-5b1d-4c2e-9a8f-1d2e3f4a5b6c",
  "session": "uuid v4 vygenerované v prohlížeči",
  "entry": "data",
  "utm": { "source": "facebook", "medium": "cpc", "campaign": "dta-podzim", "content": "video-a", "term": "" },
  "recommended": "data",
  "fav": "data",
  "goal": "switch",
  "firmInterest": false,
  "lowIncome": false,
  "paths": {
    "data":  { "status": "done", "rating": "great", "tries": 1, "viewsSeen": 3, "seconds": 214 },
    "ai":    { "status": "not_started" },
    "hry":   { "status": "in_progress", "plays": 4, "edits": 2 },
    "kyber": { "status": "not_started" }
  },
  "secondsTotal": 260,
  "opener": "Vidím, že máte za sebou datovou detektivku, a to hned napoprvé. Co vás na práci s daty bavilo?"
}
```

### Mapování na Pipedrive Coders Labu
Pipeline **Studenti** (id 2). Fáze dealu se automaticky **nemění**.

Existující pole na dealu, která se vyplní:

| Pole | Hodnota |
|---|---|
| Data Analyst (bad, average, great) | hodnocení ukázky Datová analýza |
| IT Administrator (bad, average, great) | hodnocení ukázky Kyberbezpečnost |
| ad_source, ad_medium, ad_campaign, ad_content, ad_term | UTM z URL, **jen když jsou na dealu prázdná** |

Pole Data Analyst a IT Administrator s hodnotami bad, average, great nejspíš plní starý talentový test. Ověř to u Ondřeje. Pokud ano, budou stávající filtry a pohledy obchodu fungovat dál.

Nová pole na dealu (připrav skript, který je přes API založí, a spusť ho až po schválení):

| Pole | Typ |
|---|---|
| PNZ token | text |
| Claude Code | enum: bad, average, great |
| Game Developer | enum: bad, average, great |
| PNZ doporučený směr | enum: Datová analýza, Stavění aplikací s AI, Tvorba her, Kyberbezpečnost |
| PNZ cíl | enum: změnit obor, zlepšit se v práci |
| PNZ školení přes firmu | enum: Yes, No |
| PNZ nízkopříjmová skupina | enum: Yes, No |
| PNZ poslední aktivita | datum a čas |

Pravidla hodnocení (ukázka, kterou člověk nezačal, nechává pole prázdné):

| Ukázka | great | average | bad |
|---|---|---|---|
| Datová analýza | vyřešeno napoprvé | vyřešeno na 2. nebo 3. pokus | správnou odpověď ukázal nástroj po třech chybách |
| Stavění s AI | aplikace a aspoň 2 úpravy | aplikace a 1 úprava | aplikace bez úprav |
| Tvorba her | vlastní level dohraný | výchozí level dohraný, vlastní ne | přeskočeno bez dohrání |
| Kyberbezpečnost | 3 ze 3 rozhodnutí napoprvé | 1 až 2 napoprvé | 0 napoprvé |

**Poznámka na dealu** (jedna, aktualizovaná) obsahuje totéž, co v prototypu ukazuje panel „Pohled obchodníka“: vstup, doporučený směr a kurz, co bavilo nejvíc, cíl, školení přes firmu, výsledky po ukázkách, čas v nástroji a nízkopříjmovou skupinu. Na konci je „Návrh první věty do telefonu“. Texty a logika věty jsou v prototypu ve funkcích `opener()` a `updateSales()`.

**Aktivita**: typ hovor, předmět „Zavolat: Práce na zkoušku“, termín dnes (po 17. hodině další pracovní den), přiřazená vlastníkovi dealu, do poznámky aktivity první věta do telefonu. Založit jednou na deal, až když má člověk aspoň jeden odznak.

Zájem o školení přes firmu (zaškrtávátko ve výsledku u cíle „zlepšit se v práci“) je signál pro předání do LifeScale Business. Do poznámky ho napiš výrazně na první řádek.

## 5. Analytika

Události do `window.dataLayer` (GTM). Když `dataLayer` neexistuje, nic se neděje.

| Událost | Parametry |
|---|---|
| `pnz_view` | `variant`, `entry` |
| `pnz_task_start` | `path` |
| `pnz_task_complete` | `path`, `rating`, `seconds` |
| `pnz_badge_claim` | `path`, `badges` (počet) |
| `pnz_result_view` | `recommended`, `badges` |
| `pnz_cta_click` | `type`: `webinar`, `minikurz`, `detail_kurzu`, `konzultace`, `skoleni_firmy` |
| `pnz_answer` | `question`: `fav`, `goal`, `firm`, `lowincome`, `value` |
| `pnz_game_death` | `count` |
| `pnz_game_skip` | `plays` |

Trychtýř, který chceme měřit: zobrazení, start ukázky, dokončení ukázky, výsledek, klik na další krok.

## 6. Obsah a konfigurace

- Všechny texty do `src/content/cs.json`, ceny a odkazy do `src/content/config.json`, aby je marketing mohl měnit bez zásahu do kódu.
- Ceny v DIGIkurzech (cena = spoluúčast + příspěvek úřadu práce), plánovaný stav:

| Kurz | Cena | Spoluúčast | Příspěvek ÚP |
|---|---|---|---|
| Datový analytik | 64 000 Kč | 29 000 Kč | 35 000 Kč |
| Claude Code od A do Z | 24 900 Kč | 5 795 Kč | 19 105 Kč |
| Game Developer | 49 000 Kč | 14 000 Kč | 35 000 Kč |
| IT Administrator | 54 000 Kč | 19 000 Kč | 35 000 Kč |

- Výpočet jako v prototypu (`priceFor()`): příspěvek 76,73 % ceny, nejvýš 35 000 Kč. Nízkopříjmové skupiny až 100 % ceny, také nejvýš 35 000 Kč. Zaškrtávátko nízkopříjmové skupiny se ukazuje jen tam, kde změní částku, tedy u ceny pod 45 615 Kč. Hranici počítej z konfigurace, nenatvrdo.
- V konfiguraci u každého kurzu příznak `digikurzy: true/false`. Co ukázat při `false`, je otevřená otázka (kapitola 9).
- Odkazy z prototypu: kurzy `https://coderslab.cz/cz/kurzy/data-analyst`, `https://coderslab.cz/cz/kurzy/agentic-coding`, `https://coderslab.cz/cz/kurzy/game-developer` a `https://coderslab.cz/cz/kurzy/it-administrator`, minikurz `https://coderslab.cz/cz/kurzy/data-analyst-mini`, webináře `https://coderslab.cz/cz/webinare` a konzultace přes plánovač `https://coderslabczsk.pipedrive.com/scheduler/jqrrYdCX/online-schuzka-se-specialistou`.
- Pravidla DIGIkurzů: nástroj nesmí nabízet slevu na spoluúčast ani radit, z čeho ji zaplatit. Texty o příspěvku přeber z prototypu beze změny.

## 7. Akceptační kritéria

Vzhled a texty:
- Shoda se screenshoty na 390 × 844 a 1366 × 768, ověřená Playwright snímky.
- Texty 1:1 s prototypem, včetně pevných mezer za jednopísmennými slovy. V textech nepoužívat dlouhou pomlčku (znak U+2014).
- Kontrast textu aspoň 4,5:1, viditelný fokus, dotykové cíle aspoň 44 px, `prefers-reduced-motion` vypíná animace a konfety.

Chování (všechno už v prototypu funguje, testy z `referencni-testy/` to pokrývají):
- Žádné vodorovné přetečení na šířkách 320 až 430 px, ani v ukázce Kyberbezpečnost po všech příkazech.
- Na samostatné stránce jsou na mobilu 390 × 844 vidět všechny čtyři karty bez scrollování.
- Data: plovoucí tlačítko „Znám viníka“ se ukáže po druhém zobrazeném pohledu, když jsou odpovědi mimo obrazovku, a zmizí, když jsou vidět nebo je odpověď zadaná.
- Stavění s AI: odznak až po první úpravě, žádné pole pro vlastní pokyn.
- Hra: tlačítko Hrát je na 1366 × 768 vidět bez scrollování. Po pádu se hra **sama nespouští**, „Hrát znovu“ je asi 0,9 s neaktivní. Po třech pádech se odemkne úprava levelu. Vlastní level jde dohrát. Plátno je ostré na displejích s vyšší hustotou a nedeformuje se.
- **Editor levelu jde ovládat klávesnicí**: šipky posouvají kurzor po mřížce, Enter nebo mezerník položí dílek, klávesy 1 až 4 vyberou dílek. V prototypu to zatím chybí.
- Okno s odznakem drží fokus a zavírá se Escapem. Po zavření se fokus vrátí na první z tlačítek, která se ukážou místo „Vyzvednout odznak“ (v prototypu se fokus po zavření ztrácí, to oprav).
- Widget na `test-host.html`: styly Bootstrapu se do widgetu nepropisují a styly widgetu nemění stránku. Okno s odznakem je nad lepicí hlavičkou. Přepnutí obrazovky posune widget pod hlavičku, ne na začátek stránky. Hash stránky zůstává beze změny.

Data:
- Payload odpovídá schématu, unit testy na pravidla hodnocení a na `opener()`.
- Endpoint v `DRY_RUN` zaloguje přesné volání Pipedrive API pro tři scénáře: jedna hotová ukázka, všechny čtyři, chybný token.

## 8. Postup

1. Nejdřív mi pošli **plán po fázích a seznam otázek** z kapitoly 9, které potřebuješ zodpovědět. Neprogramuj, dokud plán neschválím.
2. Kostra projektu (Vite, TypeScript, testy), přenos prototypu do modulů: stav, obrazovky, ukázky `data`, `ai`, `hry`, `kyber`, výsledek, oslava odznaku. Ověř shodu se screenshoty.
3. Custom element, Shadow DOM, atributy, `@container`, posouvání a `test-host.html`.
4. Konfigurace a texty v JSON, analytika.
5. Endpoint s `DRY_RUN`, skript na založení polí v Pipedrivu. Zapnutí ostrého zápisu až po schválení.
6. Klávesnicové ovládání editoru levelu.
7. README: jak widget vložit na web, jak změnit ceny a texty, jak nasadit endpoint, co má udělat formulář před nástrojem.

## 9. Otevřené otázky (zeptej se, nerozhoduj sám)

1. Kde poběží JS widgetu a endpoint: na serveru coderslab.cz, na Netlify, nebo na Vercelu?
2. Kde bude nástroj na webu: nahradí `/cz/talentovy-test` (vedou tam tlačítko v menu a pozvánka na webu), nebo bude na nové adrese s přesměrováním ze staré?
3. Který formulář bude před nástrojem a kdo do něj doplní vytvoření tokenu?
4. Poběží DIGIkurzy u těchto kurzů už při spuštění? Pokud ne, jakou cenu ukázat: běžnou cenu bez příspěvku, nebo přechodnou nabídku (spoluúčast plus 2 000 Kč, u Datového analytika 31 000 Kč)?
5. Komu se má přiřadit aktivita „Zavolat“: vlastníkovi dealu, nebo konkrétnímu obchodníkovi podle kurzu?
6. Pokrývá informace o zpracování osobních údajů ve formuláři před nástrojem i výsledky z nástroje? Rozhodne právník.
