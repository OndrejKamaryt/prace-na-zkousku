# IT administrátor podle Martinova zadání UX (11. 11.): postup a texty ke schválení

Podklad: `Zadani_UX_hra_kyberbezpecnost.pdf` od Martina (u Ondřeje ve Stažených souborech), požadavky UX-01 až UX-12. Týká se jen IT admina (pekárna Kvásek), data a hra se nemění. Ceny a stránka s doporučením zůstávají, jak jsou.

## Rozhodnutí Ondřeje 12. 11.

- **Texty a postup níže jsou schválené.**
- **Srovnání s hráči:** na výsledkové kartě se ukáže Martinova pevná věta „Pod 1 minutu to zvládne jen každý třetí.“ Data o hráčích zatím nemáme, Ondřej to ví a chce ji tam i tak.
- **Tlačítko „Můj výsledek“ v hlavičce:** skryje se jen na obrazovce IT admina, u dat a hry zůstává.
- **Analytika:** ukázka pošle události stránce, do které je vložená (`window.parent.postMessage`, bez osobních údajů a bez cookies), a zároveň je vyvolá jako událost na prvku widgetu. Web Coders Labu je přepošle do GTM, ukázku kódu pro Martina dát do `PREDANI.md`. Názvy událostí podle UX-12: `game_view`, `game_start`, `step_complete`, `wrong_answer`, `game_finish`, `result_cta_click`, `webinar_click`, `course_detail_click`, `replay_click`.
- **Stavba:** v nové session na Opus 5.5 s effortem xhigh.

## Co udělám

| ID | Co udělám | Poznámka |
|---|---|---|
| UX-01 | Chat je historie. Vidět jsou poslední 3 zprávy, nejnovější dole a bílá, starší ztlumené. Pořadí kroku: Terezina zpráva, pauza 400 ms, otázka, volby. Volby nejdou zmáčknout, dokud zpráva není celá. | Prázdný avatar bez zprávy zmizí. |
| UX-02 | Chat má pevnou výšku (120 px na počítači), uvnitř se posouvá. Krok začíná pořád na stejném místě a tlačítka neuskakují. | |
| UX-03 | Pokusy útočníka, karty adres i výpis terminálu berou číslo z jednoho stavu hry. Počítadlo roste do příkazu „Spočítat“, pak se zastaví na čísle, které vypíše terminál. Pruh zabezpečení odpovídá procentům (animace do 400 ms). Pod 40 % je červený, 40 až 99 % žlutý, při 100 % plný a zelený (#2fa35a). | Penalizace +25 pokusů za špatnou adresu zmizí, jinak by se čísla rozešla. Chybu potrestá hvězda (UX-10). |
| UX-04 | Po dohrání se v herním boxu ukáže výsledková karta: „Server je v bezpečí“, hvězdy 3/3, čas zásahu, čtyři dovednosti a jedno hlavní tlačítko „Co dál?“. Vedle něj jsou „Zahrát znovu“ a „Sdílet výsledek“. „Co dál?“ vede na dnešní stránku s doporučením, cenou a webinářem, ta zůstává beze změny. Pruh „Hotovo“ u IT admina zmizí, jinak by na konci byla dvě tlačítka. | Srovnání s hráči a tlačítko v hlavičce: viz otázky. Opakovaná hra se do stavu pro Pipedrive nepočítá, platí první dohrání. |
| UX-05 | Přes herní box je úvod s briefingem a tlačítkem „Začít zásah“. Čas zásahu i útok na mapě začnou až po kliknutí. U IT admina „2 minuty“ místo „5 minut“, a to v perexu, na kartě na úvodu i v dalších příkladech. | |
| UX-06 | Nový výpis v terminálu je 1,5 s zvýrazněný žlutým rámečkem. Pod tlačítkem se objeví shrnutí výsledku lidsky. U každého příkazu je ikona ⓘ, která po klepnutí vysvětlí, co příkaz dělá. | Ikona funguje na klepnutí, takže jde i na mobilu a z klávesnice. |
| UX-07 | Pravý sloupec: zhruba 40 % mapa, 60 % terminál. Terminál se posouvá na poslední příkaz a nic ho nepřekrývá. Mapa má od začátku legendu a popisek „útočník“. | |
| UX-08 | Jediná akce v kroku je vždy plné žluté tlačítko, volby jsou obrysové karty. Červená je jen pro chybu, „Zablokovat“ už nebude červené. Text všude s kontrastem aspoň 4,5 : 1. | |
| UX-09 | U tlačítka „Vybráno 0/2“. „Nasadit štíty“ jde zmáčknout až při dvou. Třetí výběr nejde, ukáže se hláška. „Hlídač fail2ban“ se přejmenuje, název nástroje bude v podtextu. Podtexty, které prozrazovaly odpověď, zmizí. Na 1366 × 720 je celý box vidět bez posouvání, po startu se na něj stránka posune. | Martin nabízí i variantu, kdy třetí výběr nahradí nejstarší. Volím blokování s hláškou, je srozumitelnější. |
| UX-10 | Špatná volba se označí červeně s ✕, pod ní je vysvětlení z pohledu admina a tlačítko „Zkusit znovu“. První chyba vezme hvězdu za rozhodnutí napoprvé, hra pokračuje. | |
| UX-11 | V přehledu nahoře přibude karta „Hvězdy“ se třemi hvězdami. Hvězda ubude při první chybě a po 2 minutách. Na konci je jasné „3/3“. | |
| UX-12 | Mobil: přehled, chat, krok, sbalitelný terminál na 6 řádků, zmenšená mapa. Tlačítka aspoň 44 px vysoká. Bez animací zmizí prstence a tečky. Ovládání klávesnicí, nové zprávy hlásí čtečka, význam nenese jen barva. | Analytika: viz otázky. |

Technika: stavový automat úvod, krok 1, 2 a 3, výsledek. Každý krok má fáze zpráva, otázka, volby a zpětná vazba. Čísla jsou v jednom stavu, časovač se při skryté záložce zastaví.

## Texty ke schválení

Většina je z Martinova zadání (kapitola 4 a nákresy), upravená podle pravidel projektu: bez teček mezi slovy, bez dlouhé pomlčky, s pevnými mezerami. Nové texty, které v zadání nejsou, mají poznámku **nové**.

### Úvod přes herní box
- Štítek: „Tvůj první zásah, 2 minuty“
- Nadpis: „Někdo se dobývá do serveru pekárny Kvásek“
- Text: „Jsi správce serveru. Najdi útočníka, zavři mu dveře a zabezpeč server. Všechno uděláš tlačítky.“
- Tlačítko: „Začít zásah“
- Hvězdy: „Za rychlost“, „Za správná rozhodnutí“, „Za ubráněný server“

### Nad hrou
- Perex zkrácený, ať se hra vejde na obrazovku: „Staráš se o server pekárny Kvásek, přes který chodí objednávky z kaváren.“
- Délka: „2 minuty“, v dalších příkladech „asi 2 minuty“

### Přehled a mapa
- Karty: „Zabezpečení serveru“, „Čas zásahu“, „Pokusy útočníka“, „Hvězdy“
- Legenda mapy: „útočník“, „běžní uživatelé“, „server Kvásek“

### Krok 1 ze 3: Najdi útočníka
- Tereza: „Promiň, že budím. Od 3:00 se někdo pořád dokola pokouší přihlásit na server s objednávkami. Mrkneš na to?“
- Pokyn: „Server si zapisuje každý pokus o přihlášení. Podívej se na ty, které neprošly.“
- „Ukázat neúspěšná přihlášení“, ⓘ „Vypíše poslední 4 neúspěšné pokusy o přihlášení ze záznamu serveru.“, shrnutí „Někdo zkouší hesla k účtům root, admin a petra, pořád ze stejné adresy.“
- Pokyn: „Spočítej, kolikrát to zkusila která adresa.“
- „Spočítat pokusy podle adresy“, ⓘ „Vybere neúspěšná přihlášení a spočítá je podle IP adresy.“, shrnutí „Jedna adresa to zkusila 412×, ostatní jen jednou nebo třikrát. To bude útočník.“ (číslo podle stavu hry)
- Otázka: „Klikni na adresu útočníka.“
- Špatně 198.51.100.23: „Tři pokusy jsou nejspíš někdo z kanceláře, kdo si spletl heslo.“
- Špatně 192.0.2.10: „Jeden neúspěšný pokus je běžný překlep.“

### Krok 2 ze 3: Zavři dveře
- Tereza: „Správně! Tolik pokusů za pár minut nezkouší člověk, ale program, který hádá hesla. Zablokuj ho.“
- „Zablokovat adresu útočníka“, ⓘ „Přidá do firewallu pravidlo, které zahodí vše z této adresy.“, shrnutí „Hotovo, útočník se k serveru už nedostane.“
- Tereza: „Útočník je venku. Jen zkontroluj, jestli se nestihl dostat dovnitř.“
- „Ukázat, kdo se přihlásil“, ⓘ „Vypíše poslední úspěšná přihlášení včetně IP adresy.“, shrnutí „Pozor: ve 3:12 se z adresy útočníka přihlásil účet petra.“
- Tereza: „Ve 3:12 se z adresy útočníka přihlásila Petra. Jenže Petra ve tři ráno spí.“
- Otázka: „Co uděláš s Petřiným účtem?“
- Volby: „Účet smažu i se všemi daty.“, „Účet zamknu, prověřím a s Petrou nastavím nové heslo.“, „Nic, útočníka už blokuje firewall.“
- Špatně smazat: „Smazáním přijdeš o stopy, co útočník dělal, a Petra o data. Účet radši zamkni a prověř.“
- Špatně nic: „Firewall blokuje jen jednu adresu. Útočník zná Petřino heslo a může přijít odjinud.“

### Krok 3 ze 3: Ať se to neopakuje
- Otázka: „Účet je zamčený. Vyber dva štíty, které na serveru nasadíš.“
- Volby: „Přihlašování digitálním klíčem místo hesla“, „Vypínat server přes noc“, „Automaticky blokovat po 5 chybných pokusech“ s podtextem „nástroj fail2ban“, „Přejmenovat server“
- U tlačítka: „Vybráno 0/2“, tlačítko „Nasadit štíty“
- **nové** Třetí výběr: „Vybrat jde jen dva štíty. Nejdřív jeden odeber.“
- Špatně vypínat: „Objednávky chodí brzy ráno, pekárna by přišla o zákazníky. A útok může přijít i ve dne.“
- Špatně přejmenovat: „Útočník útočí na adresu, ne na jméno. Přejmenování nic nezmění.“

### Chyba (všechny kroky)
- Tlačítko: „Zkusit znovu“
- **nové** Při první chybě: „Hvězda za rozhodnutí napoprvé je pryč, hra ale pokračuje.“

### Výsledková karta
- Tereza: „Díky, jdu zpátky k pecím. Objednávky jedou dál.“
- Nadpis: „Server je v bezpečí“, pod ním hvězdy a „3/3“
- „Zásah za 0:38“ (čas podle hry)
- Dovednosti: „Čtení logů“, „Firewall“, „Správa účtů“, „SSH klíče“
- „Přesně tohle dělají IT administrátoři každý den. A přesně tohle se naučíš v kurzu.“
- Tlačítka: „Co dál?“, „Zahrát znovu“, „Sdílet výsledek“
- **nové** Text ke sdílení: „Server pekárny Kvásek je v bezpečí. Hvězdy 3/3, čas zásahu 0:38. Zvládneš to rychleji?“ a odkaz na ukázku
- **nové** Po zkopírování odkazu na počítači: „Odkaz je zkopírovaný.“
