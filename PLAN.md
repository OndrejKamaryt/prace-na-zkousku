# Práce na zkoušku: plán po fázích a otázky

Odpověď na kapitolu 8, bod 1 zadání. Neprogramuji, dokud plán neschválíš. Podrobné nálezy s doklady (soubor a řádek, výstupy příkazů) jsou v `NALEZY.md`, tady jsou odkazy na jejich čísla.

## Co jsem prověřil

- Celé `ZADANI.md` proti prototypu, řádek po řádku. Ceny, `priceFor()`, `opener()`, `best()` a `why()` jsem přepočítal v Node na kódu vyříznutém z prototypu.
- Referenční testy jsem pustil proti prototypu v Edge (Playwright 1.64). Všechny čtyři proběhly dvakrát se stejným výsledkem.
- Screenshoty, přístupnost a přetečení jsem měřil na šířkách 320 až 430 px a na 1366 × 768.
- Z Pipedrivu Coders Labu jsem jen četl metadata polí, nic jsem nezapisoval.
- Na živém coderslab.cz jsem měřil hlavičku, z-index, písma a Bootstrap, jen čtením.

V projektu jsem kromě tohoto souboru a `NALEZY.md` nic neměnil.

## Rozhodnuto 29. 10. 2026

Ondřej odsouhlasil tyto odpovědi. Čísla odpovídají otázkám níže.

- **Pořadí fází:** custom element se Shadow DOM hned od fáze 2.
- **7, přeskočená hra:** žádný odznak, na kartě „Přeskočeno“, pruh „tvůj level je dohraný!“ se neukáže, výsledek zůstane dostupný, hodnocení bad. Věta do telefonu: „Vidím, že ukázku s tvorbou her máte rozehranou. Které hry hrajete nejraději?“ Opravit i „a dokonce dohraný“, aby platilo jen pro vlastní level.
- **8 a 10, druhá návštěva a souběh:** slučovat na serveru, v prohlížeči nic neukládat. První dokončené hodnocení ukázky se už nemění, stav ukázky jen roste, u odpovědí platí poslední. Sloučený stav, id poznámky a id aktivity drží jedno skryté pole dealu „PNZ stav“ (dlouhý text, JSON).
- **9, pole starého testu:** PNZ jen doplní prázdné pole, stejně jako u `ad_*`.
- **11, poslední aktivita:** dvě pole, „PNZ poslední aktivita“ (datum) a „PNZ poslední aktivita, čas“ (čas).
- **12, pevné mezery:** opravit jedním pravidlem všude, ostatní texty 1:1. Hlídá to test nad `cs.json`.
- **13, texty z prototypu:** větu „Ceny jsou v prototypu orientační.“ vypustit. Vstup: „odkaz na ukázku Datová analýza“ (`?ukazka`), „stránka kurzu, ukázka Datová analýza“ (`data-start`), „úvodní stránka nástroje“, v poznámce navíc řádek „Stránka: <cesta>“.
- **14, data pro obchod:** opravy podle bodu 14. Stavění s AI se hodnotí podle aplikace s nejvíc úpravami a věta do telefonu nese její název. Text do `why()` pro odhalenou odpověď: „Správnou odpověď ukázal nástroj“.
- **15:** poznámku a větu do telefonu skládá server, z prohlížeče jdou jen výčtové hodnoty a čísla, pole `opener` z payloadu odpadá.
- **16:** parametr `pnz` se vyřadí v GTM, widget adresu stránky nemění.
- **17:** JSON v repozitáři, úpravy přes pull request a automatické nasazení.
- **18:** resetování hnití dealů se přijímá.
- **19:** data v ukázkách počítat od dneška, mince zobrazit jako „6/6“.
- **20:** zaškrtávátko „Studuji poslední ročník, nebo jsem bez práce a nepobírám podporu“, v poznámce „má zájem“ a „nebavilo“.

Doplněno 3. 11. 2026:

- **Texty do poznámky:** nadpis „Zájem o školení přes firmu, předat LifeScale Business“, „nebavilo (název ukázky)“, „otázka se nezobrazila“, bez hotové ukázky věta „Zatím nic nedokončeno.“
- **Výsledek s jednou hotovou ukázkou** má nadpis „Tvoje první práce na zkoušku“, od dvou ukázek „Tvůj nejsilnější směr“.
- **První krok k příspěvku:** „Jde to i ve chvíli, kdy práci máš nebo podnikáš na IČO.“
- **Widget se staví jako embed na stránce webu**, samostatná stránka je až druhotná. Demo na GitHub Pages ukazuje prototyp vložený do napodobeniny coderslab.cz (`scripts/build-site.ts`).

Otevřené zůstávají otázky 1 až 4 a 6 a tabulka spouštěčů analytiky (fáze 4). Otázka 5: aktivita patří vlastníkovi dealu, jak píše kapitola 4.

## Co sedí

- Ceník v kapitole 6 sedí ve všech čtyřech řádcích. Hranice 45 615 Kč je přesná při zaokrouhlení dolů, které prototyp používá.
- Všech sedm odkazů z kapitoly 6 vrací 200. Odkaz na školení pro firmy v seznamu chybí (Z18).
- Chování z kapitoly 7 v prototypu opravdu funguje. Testy prošly až na jednu výjimku: políčko trackeru návyků má 32 px místo 44 px (R9).
- Pipedrive: pipeline Studenti má id 2. Pole Data Analyst a IT Administrator (enum bad, average, great) i `ad_*` existují. Žádné z nových polí zatím neexistuje. Typ aktivity `call` existuje.
- Prototyp nemá dlouhou pomlčku, oddělovače s tečkou ani špatné uvozovky. Názvy odznaků sedí.
- Žádný screenshot není zastaralý, všech 158 viditelných textů v prototypu je.

## Otázky z kapitoly 9

1. **Hosting widgetu a endpointu.** Navíc s tím souvisí dvě věci. Endpoint potřebuje sdílené úložiště (zámek proti souběhu a limit požadavků, E5). A pokud samostatná stránka poběží mimo coderslab.cz, musí její doména do CORS (Z7).
2. **Adresa nástroje.** `/cz/talentovy-test` je dnes holý Typeform bez šablony webu, bez GTM a bez písem (E3). Embed se tam nedá jen vložit. Lidé z menu navíc přijdou bez tokenu. Stačí ti, že se o nich do Pipedrivu nic nezapíše?
3. **Formulář před nástrojem.** Zakládá deal, nebo lead? Endpoint podle toho hledá (E7). API token musí patřit uživateli, který vidí všechny dealy.
4. **DIGIkurzy při spuštění.** Beze změny.
5. **Komu přiřadit aktivitu.** Kapitola 4 to už rozhoduje (vlastník dealu), kapitola 9 to má otevřené (Z15). Beru vlastníka dealu, dokud neřekneš jinak.
6. **Osobní údaje.** Beze změny, rozhodne právník.

## Nové otázky, které potřebuji rozhodnout před začátkem

7. **Přeskočená hra dává odznak „Level dohraný“** (T5, Z1). Po „Stačí, chci výsledek“ se ukáže pruh „tvůj level je dohraný!“, odznak se dá vyzvednout a do Pipedrivu jde věta „máte postavený vlastní level“, i když člověk nic neupravil. Má přeskočení dávat odznak? A jaká věta do telefonu pro ten případ?
8. **Druhá návštěva přepíše první** (Z4, A5). Prototyp nic neukládá. Kdo otevře odkaz z e-mailu podruhé, začne od nuly, a celý snímek by smazal hodnocení z první návštěvy. Navrhuji, aby endpoint slučoval: hotovou ukázku nikdy nepřepíše nezačatou, nechá lepší hodnocení a poznámku složí ze sloučeného stavu. Alternativa je ukládat stav v prohlížeči, ale `localStorage` patří doméně coderslab.cz, tedy hostitelské stránce.
9. **Pole starého testu** (E6). Data Analyst a IT Administrator mají stejnou stavbu jako Backend Developer, Frontend Developer a Tester, nejspíš je tedy plní starý test. Smí PNZ přepsat výsledek starého testu, nebo jen doplnit prázdné pole jako u `ad_*`? Poběží starý test dál?
10. **Dvě technická pole navíc** (E5). Jedna poznámka a jedna aktivita na deal se bez evidence nedají spolehlivě najít a při souběhu (debounce a `sendBeacon` při zavření) by vznikly dvakrát. Navrhuji pole „PNZ id poznámky“ a „PNZ id aktivity“ (text).
11. **„PNZ poslední aktivita: datum a čas“** (E8). Pipedrive typ datum a čas nemá. Možnosti jsou pole datum plus pole čas, nebo jedno textové pole s ISO časem. Já bych volil datum plus čas, dají se filtrovat.

## Rozhodnutí k textům a chování

Všechno jsou změny textů nebo chování proti prototypu, proto se ptám.

12. **Pevné mezery** (T1, Z14). Prototyp je sám porušuje na 16 místech v rozhraní a na 3 místech v textech pro Pipedrive. Formátovač cen je v pořádku (`64 000 Kč` má obě pevné mezery), chybí ale v `mins()`, `fmtDur()`, v řadě statických textů a za jednopísmennými slovy. Mám je opravit jedním obecným pravidlem a jinak texty přebrat 1:1?
13. **Texty z prototypu, které do produkce nepatří** (T3, T4, Z11, A12). Jde o větu „Ceny jsou v prototypu orientační.“ a o popisky vstupu „reklama na datovou analýzu (odkaz #data)“. Vstup přes `data-start` na stránce kurzu přitom není reklama. Navrhuji posílat i zdroj vstupu (`url`, `atribut`, `výchozí`) a popisky přepsat. Nové znění ti pošlu ke schválení.
14. **Chyby v datech pro obchod** (T6, Z10, Z3, Z2, R4, Z9, A14). Opravil bych je takto:
    - „Spíš ne“ u jedné ukázky se po druhé ukázce připíše jiné práci, a do Pipedrivu tak jde „ukázka AI vás nechytla“. Odpověď navážu na konkrétní ukázku.
    - Zaškrtnutý zájem o školení přes firmu zůstane i po změně cíle na „změnit obor“, takže by se poslalo falešné předání do LifeScale Business. Pošlu ho jen u cíle „zlepšit se“.
    - Nízkopříjmová skupina se u tří kurzů vůbec neukáže, a přesto se zapíše „No“. Zavedu třetí stav „neptali jsme se“ a pole nechám prázdné.
    - U Datové analýzy nejde odlišit vyřešení na 3. pokus od odpovědi, kterou ukázal nástroj. Bez toho se nespočítá ani hodnocení bad. Přidám příznak a k němu nový text do `why()`.
    - Stavění s AI sčítá úpravy přes všechny nápady a počítá i nedokončené. Platí hodnocení pro poslední, nebo pro nejvíc upravený nápad?
15. **Opener skládat na serveru** (V2-3). Token je v odkazu, takže kdo ho zná, mohl by do CRM poslat libovolnou větu. Navrhuji posílat jen výčtové a číselné hodnoty a poznámku i větu do telefonu skládat na serveru ze stejného kódu jako widget. Pole `opener` by z payloadu zmizelo.
16. **Token v URL a analytika** (V2-4). GTM posílá celou adresu i s `?pnz=`, takže token skončí v analytice. Buď ho widget po přečtení odstraní přes `history.replaceState` (to je zásah do hostitelské stránky, potřebuji výjimku), nebo se parametr vyřadí v GTM.
17. **„Bez zásahu do kódu“** (V2-2). JSON se při buildu vloží do jednoho JS souboru, takže změna ceny znamená nový build. Navrhuji JSON v repozitáři, úpravu přes pull request a automatické nasazení. Stačí to?
18. **Hnití dealu** (E10). Každý zápis z nástroje vynuluje odpočet hnití dealu. Vadí to obchodu?
19. **Drobnosti v ukázkách** (T12). „Mince: 6 z 6“ (předložka se volí podle seznamu [2, 3, 4, 7]). Pevná data „Po 2. 11.“ v rezervaci a „Mon Oct 26“ v logu zastarají za týden. Mám data počítat od dneška?
20. **Muž jako výchozí rod** (T7, T8). Zaškrtávátko „Jsem student posledního ročníku…“ a v poznámce „zajímá ho“ a „nebavilo ho to“. Měnit?

## Kde zadání neodpovídá skutečnosti a co navrhuji místo toho

Tohle bych udělal jinak, než píše zadání. Pokud nesouhlasíš, řekni.

- **Odstup hlavičky není 176 px** (A2, E2, Z19). 60 + 59 + 56 je 175. Na stránkách kurzů je hlavička vysoká 199 px (podmenu má 80 px), na stránce bez podmenu 118 px, mezi 992 a 1199 px 60 px a na mobilu nahoře nic nelepí. Navrhuji `data-scroll-offset="auto"`, které výšku změří za běhu, a číslo jako ruční přepis. Při prvním vykreslení widget stránkou neposune (V2-1).
- **z-index 2000 nestačí** (A1, E12). Ikona poradce má 5000, lišta cookies přesně 2000 a mobilní dolní lišta webu 70 px a 5000. Okno s odznakem a konfety dám do top layer (`<dialog>` přes `showModal()`), plovoucí tlačítko přes `popover` a v embedu ho zvednu nad dolní lištu.
- **Ubuntu Mono web nenačítá** (A9, S5, E1) a `@font-face` uvnitř Shadow DOM v Edge opravdu nefunguje (ověřeno). Možnosti: widget vloží jeden `<link>` do `<head>` (zásah do hostitele, potřebuji výjimku), web písmo přidá do svého CSS, nebo hra a terminál pojedou na systémovém monospace. Doporučuji, ať ho přidá web.
- **„Hrát vidět bez scrollování na 1366 × 768“ v embedu splnit nejde** (A3, R7, V3-1). Pod hlavičkou 176 až 199 px vychází tlačítko na 814 px a víc. Navrhuji kritérium jen pro samostatnou stránku.
- **Pipedrive API v1 je od 1. 8. 2026 mimo podporu** (E4). Dealy, vyhledávání, aktivity a pole budu dělat přes v2. Poznámky existují jen ve v1, ty zůstanou tam.
- **Referenční testy skoro nic netvrdí** (R6, R1, A16). Většina řádků jen tiskne hodnotu bez očekávání. Kontroly přes `document` v `page.evaluate` by po přenosu do Shadow DOM tiše prošly. Při přepisu do TypeScriptu doplním skutečné asserce a testy pro kritéria, která dnes nikdo nehlídá (R2): test-host, šířky 320 až 430, návrat fokusu, klávesnice editoru, data.
- **Screenshoty nejde porovnat 1:1** (S1, S2, R8, S11). Na každém je štítek Prototyp, patička, panel obchodníka nebo tmavá hlavička. Mobilní mají DPR 2, notebookové DPR 1 a různé výšky. Navrhuji nafotit nové reference z upraveného prototypu (bez vyřazených částí, s opravenými mezerami) a porovnávat s tolerancí. Embed předlohu nemá vůbec, světlý pruh s odznaky v prototypu není (S3, A13). Navrhnu ho a pošlu ti snímek ke schválení.
- **Přístupnost** (S6, S7, S8). 13 druhů ovládacích prvků je pod 44 px. Fokus na tmavém terminálu má kontrast 1,63:1. Na mobilu ve výsledku neodpovídá pořadí Tab tomu, co je vidět. Kritéria z kapitoly 7 tedy vyžadují úpravy vzhledu proti screenshotům, opravím je v rámci fáze 6.

## Plán po fázích

Proti kapitole 8 měním jedno pořadí. Custom element se Shadow DOM stavím hned na začátku. Přenos 1:1 do běžného DOM by se ve fázi 3 stejně musel přepsat (delegace kliků, past fokusu, `:root`), viz Z6 a A4.

**Fáze 1, kostra a logika bez DOM.** Vite v library mode, TypeScript, Vitest, Playwright v TypeScriptu. Čistá logika jako samostatné moduly: stav, hodnocení, ceny z `config.json` (hranice nízkopříjmové skupiny jako strop / sazba), doporučení, `why()`, věta do telefonu a schéma payloadu. Unit testy na hodnocení a větu do telefonu včetně případů z otázek 7, 13 a 14. Texty rovnou do `cs.json` se šablonami pro skloňování (V1-1), aby se nepřenášely dvakrát. *Hotovo, když:* unit testy prochází a schéma payloadu máš ke schválení.

**Fáze 2, obrazovky v custom elementu, samostatná stránka.** `<prace-na-zkousku>` s otevřeným shadow root, vlastní stav místo hashe, posluchače na shadow root. Úvod, Data, Stavění s AI, Hra (plátno až při otevření), Kyberbezpečnost, výsledek, okno s odznakem. Referenční testy přepsané do TypeScriptu se skutečnými assercemi, běh přes `http://localhost`, protože ES modul se přes `file://` nenačte. *Hotovo, když:* `dist/index.html` se chová jako prototyp a snímky sedí s novými referencemi.

**Fáze 3, embed.** Atributy, `?ukazka`, `?pnz`, UTM, `@container`, `:host` s resetem zděděných vlastností (písmo, `line-height` a barva z `body` webu do stínu projdou, A8), automatický odstup, top layer, písma podle varianty. `test-host.html` věrný webu: Bootstrap 5.2.3, hlavička 199 px s variantou bez podmenu, lišta cookies se z-index 2000, ikona poradce 5000, mobilní dolní lišta 70 px. *Hotovo, když:* testy izolace stylů, hashe, posunu a překryvů prochází.

**Fáze 4, analytika a odesílání.** Události do `dataLayer` podle tabulky spouštěčů, kterou ti pošlu ke schválení (Z12: kdy je „start ukázky“, počítadlo pádů, kódování `value`). Odesílání s debounce 2 s a `sendBeacon` jako `text/plain`.

**Fáze 5, endpoint v `DRY_RUN`.** Jedno jádro (validace bez nové závislosti, slučování stavu, mapování na id voleb polí, skládání poznámky a aktivity) a adaptéry pro Netlify, Vercel a Node. Kontrola `Origin` u každého požadavku včetně `text/plain`, limit 10 kB, limit na token a IP, termín aktivity v pražském čase (E11), zápis jen změn. Skript na založení polí napíšu, ale nespustím. *Hotovo, když:* `DRY_RUN` zaloguje přesná volání pro tři scénáře ze zadání plus druhou návštěvu a souběžné odeslání.

**Fáze 6, klávesnice a přístupnost.** Editor levelu ovládaný jen s fokusem na plátně: šipky, Enter a mezerník, číslice podle `e.code`, protože na české klávesnici dává klávesa 1 znak „+“ (A10). Návrat fokusu po zavření okna, cíle 44 px, viditelný fokus na tmavých plochách. Nové texty nápovědy ti pošlu ke schválení.

**Fáze 7, README a pomocná funkce na token.** Vložení na web, změna cen a textů, nasazení endpointu, co má udělat formulář před nástrojem.

**Fáze 8, ostrý provoz, až po tvém schválení.** Založení polí v Pipedrivu, vypnutí `DRY_RUN`.

## Co od tebe potřebuji teď

Odpovědi pro fáze 1 a 2 jsou rozhodnuté (viz „Rozhodnuto“). Hosting, formulář před nástrojem a tabulka analytiky počkají do fáze 4. Pole „PNZ stav“ a dvě pole pro poslední aktivitu přibydou do skriptu na založení polí, který se spustí až po schválení.
