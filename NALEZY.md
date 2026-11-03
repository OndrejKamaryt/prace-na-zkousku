# Nálezy z prověrky zadání

Podklad k souboru PLAN.md. Každý nález prošel nezávislým ověřením proti souborům (potvrzeno, nebo částečně s opraveným zněním). Vyvrácený nález je na konci. Čísla řádků odkazují na `prototyp/prace-na-zkousku.html`, pokud není uvedeno jinak.

Oblasti: T texty, Z zadání proti prototypu, A architektura převodu, R referenční testy, S screenshoty a přístupnost, E Pipedrive a coderslab.cz, V doplněno při ověření.

## Vysoká závažnost (6)

### T5: Po přeskočení hry se ukáže odznak „Level dohraný“ a do Pipedrivu odejde věta o postaveném levelu

*chyba-v-prototypu, potvrzeno*

Tlačítko „Stačí, chci výsledek“ (1466) volá markDone('hry', true). Výsledek pak píše „Hra přeskočená“, ale zároveň:
- návštěvník dostane odznak „Level dohraný“,
- na kartě se objeví „Hotovo ✓“,
- ve hře se odkryje pruh „Hotovo, tvůj level je dohraný!“ (638) s tlačítkem „Vyzvednout odznak“.

opener() (1747) přeskočení ani počet úprav nekontroluje. Do poznámky a aktivity proto jde „Vidím, že máte postavený vlastní level.“ i při 0 upravených dílcích.

Podle kódu (1371, 1747) se k větě přidá „a dokonce dohraný“ i tehdy, když člověk dohrál jen výchozí level. To jsem během neověřil.

Název odznaku je správný, v této situaci ale tvrdí něco, co se nestalo.

**Doklad:** Běh v Edge headless na kopii prototypu ve scratchpadu (requestAnimationFrame nahrazený časovačem, 6 pádů a pak přeskočení): 'B got badges (result): Level␣dohraný', 'B why: Hra␣přeskočenáUpravené␣dílky:␣0', 'B claim bar #g-done hidden=false text: Hotovo,␣tvůj␣level␣je␣dohraný!…', 'B opener: …Vidím,␣že␣máte␣postavený␣vlastní␣level.␣Které␣hry␣hrajete␣nejraději?'

**Návrh:** Ondřej rozhodne, co se po přeskočení ukáže: žádný odznak, nebo jiný neutrální stav. V tom případě pruh „…je dohraný!“ neodkrývat a do opener() doplnit větu pro přeskočenou hru (nový text ke schválení). Přidat na opener() unit test pro přeskočení.

### Z1: Přeskočená hra se počítá jako hotová ukázka s odznakem „Level dohraný“

*chyba-v-prototypu, potvrzeno*

Tlačítko „Stačí, chci výsledek“ volá markDone('hry'). Hra se tím označí jako hotová, přibude odznak „Level dohraný“, karta ukáže „Hotovo ✓“ a v ukázce se objeví pruh „Hotovo, tvůj level je dohraný!“ s tlačítkem na vyzvednutí odznaku. Přeskočená hra pak může vyjít jako „Tvůj nejsilnější směr“. Při remíze ji pořadí upřednostní před kyberbezpečností, a se 5 upravenými dílky porazí i hotovou kyberbezpečnost s jedním rozhodnutím napoprvé. opener() pak tvrdí „Vidím, že máte postavený vlastní level“ i při 0 úpravách. Po přeskočení, kterému předcházelo dohrání výchozího levelu, dokonce tvrdí „a dokonce dohraný“. V Pipedrivu by se tím splnilo „aspoň jeden odznak“ pro založení aktivity a zapsal by se doporučený směr Tvorba her. Pro přeskočení navíc chybí stav v payloadu (status zná jen done, in_progress a not_started).

**Doklad:** ř. 1466 `$('#g-skip')...{ S.hry.skipped = true; markDone('hry', true); location.hash = 'vysledek'; }`; ř. 875 až 880. Headless skip: 'after skip: S.hry {done:true,skipped:true,wins:0,edits:0} prog Odznaky 1/4 badge got [Level dohraný] card state Hotovo ✓ #g-done hidden false', 'result: Tvůj nejsilnější směr / Tvorba her / opener Vidím, že máte postavený vlastní level.' Headless skipvskyber: 'if kyber firstOk=0: score kyber 2 score hry 2 best hry', 'kyber 2.4 hry 2.5 best hry'. node opener.js: 'hry default won, then skipped' → '...vlastní level a⍽dokonce dohraný'.

**Návrh:** Zavést samostatný stav skipped: bez odznaku a bez pruhu „Hotovo“, nezapočítat ho do „aspoň jeden odznak“ a vyřadit ho z best(), nebo ho brát až jako poslední možnost. Pro přeskočenou hru připravit vlastní texty do opener() a why(); texty schválí Ondřej. Ondřeje se zeptat, jestli má přeskočení vůbec dávat odznak.

### Z4: Snímek stavu bez perzistence může na dealu přepsat dřívější výsledky

*riziko, potvrzeno*

Prototyp drží stav jen v paměti. Po obnovení stránky nebo po druhém otevření odkazu z e-mailu (i na jiném zařízení) začíná od nuly. ZADANI chce, aby endpoint pokaždé přepsal pole celým snímkem, a ukázka, kterou člověk nezačal, má nechat pole prázdné. Není ale řečeno, jestli „prázdné“ znamená „nesahat“, nebo „vymazat“, ani jak sloučit víc relací se stejným tokenem (pole session v payloadu je, pravidlo chybí). Druhá relace s jedinou ukázkou by tak mohla smazat hodnocení a poznámku z první. Poznámka by se navíc přepsala méně úplným obsahem.

**Doklad:** Stav S ř. 760 až 766, grep localStorage, sessionStorage a pagehide: 0 výskytů. ZADANI ř. 76 „widget posílá vždy celý aktuální snímek stavu a endpoint pole přepisuje“, ř. 131, ř. 64 (odkaz s tokenem v e-mailu), ř. 86 (session). Scénář je odvozený, neověřeno proti Pipedrivu.

**Návrh:** Rozhodnout s Ondřejem jednu ze dvou cest: (a) endpoint slučuje po ukázkách, hotovou ukázku nikdy nevrátí na nezačatou a drží lepší nebo poslední dokončené hodnocení; (b) widget ukládá stav k tokenu do localStorage a po návratu ho obnoví. Pravidlo zapsat do schématu a pokrýt testem endpointu se dvěma relacemi.

### A5: Bez uloženého stavu přepíše další návštěva dřívější výsledky v Pipedrivu

*otazka, potvrzeno*

Prototyp nic neukládá. Po obnovení stránky nebo po návratu přes stejný odkaz s ?pnz začíná člověk s prázdnými odznaky a novou session. Zadání chce, aby widget posílal vždy celý snímek a endpoint pole přepisoval. Druhá návštěva by tedy u ukázek z první návštěvy poslala not_started. Podle toho, jak se vyloží „nechává pole prázdné“, by smazala hodnocení, poznámku i první větu do telefonu.

**Doklad:** grep localStorage|sessionStorage|cookie|indexedDB v prototypu: žádný výskyt; prototyp 760-766 (stav jen v paměti); ZADANI.md:76 widget posílá vždy celý aktuální snímek stavu a endpoint pole přepisuje; ZADANI.md:131 ukázka, kterou člověk nezačal, nechává pole prázdné.

**Návrh:** Zeptat se Ondřeje. Bezpečný základ: endpoint nikdy nepřepíše vyplněné hodnocení prázdným a ponechá lepší z hodnocení, poznámku skládá ze sloučeného stavu. Volitelně ukládat stav do sessionStorage pod klíčem podle tokenu. Je to ale úložiště domény coderslab.cz, tedy stav hostitele, a potřebuje to souhlas.

### E5: Jedna poznámka a jedna aktivita na deal: chybí způsob, jak je najít, a hrozí souběh

*mezera, potvrzeno*

ZADANI chce poznámku aktualizovat místo přidávání a aktivitu založit jen jednou, endpoint má ale být bezstavový (Netlify, Vercel, Node). Poznámka v Pipedrive nemá štítek ani vlastní pole, podle kterého by šla najít. Zbývá stáhnout všechny poznámky dealu (20 tokenů) a hledat podle obsahu, u aktivit stáhnout seznam (10 tokenů) a hledat podle předmětu. Widget navíc posílá po odznaku s debounce 2 s a při zavření stránky přes sendBeacon. Dva požadavky tak mohou běžet souběžně, oba nenajdou poznámku ani aktivitu a obě založí dvakrát. Idempotenční klíč jsem v API Pipedrive nenašel (neověřeno).

**Doklad:** ZADANI.md:76 „Poznámku na dealu aktualizuje (jedna poznámka … ne nová při každém odeslání). Aktivitu zakládá jen jednou.“; ZADANI.md:79 „S debounce 2 s, při zavírání stránky přes navigator.sendBeacon“; ZADANI.md:72 „aby šel nasadit na Netlify, Vercel i jako Node server“. https://developers.pipedrive.com/docs/api/v1/Notes: GET /api/v1/notes s deal_id (cost 20), PUT /api/v1/notes/{id} (cost 10). https://developers.pipedrive.com/docs/api/v1/Activities: GET /api/v2/activities s deal_id (cost 10).

**Návrh:** Ukládat id poznámky a id aktivity do dvou skrytých technických polí dealu (například PNZ id poznámky a PNZ id aktivity, typ varchar). Číst je spolu s dealem, zakládat jen když jsou prázdná a hned po založení je zapsat. Souběh řešit krátkým zámkem na token ve sdíleném úložišti (to stejně bude potřeba pro limit požadavků na token a IP). Poznámku připnout (pinned_to_deal_flag=1). Na dvě další pole je potřeba Ondřejův souhlas.

### E6: Pole Data Analyst a IT Administrator: hrozí přepsání nebo smazání výsledků starého testu

*otazka, potvrzeno*

Obě pole jsou enum s možnostmi bad, average, great a ve v2 se zapisují číselným id (Data Analyst 151, 152, 153; IT Administrator 154, 155, 156). Stejné schéma mají Backend Developer, Frontend Developer a Tester, což odpovídá staršímu testu s pěti směry (čím se pole plní, jsem neověřil). Starý talentový test na /cz/talentovy-test pořád běží jako Typeform. ZADANI zároveň říká, že endpoint přepisuje pole celým snímkem a že nezačatá ukázka nechává pole prázdné. Když to implementace pochopí jako zápis prázdné hodnoty, smaže výsledek starého testu. I bez toho PNZ přepíše starší hodnotu novou a filtry obchodu pak budou míchat dva různé testy.

**Doklad:** getAccountContext (mcp__6dddced0…): 'Data Analyst' | 8c005df31b764922c97ec766be9559fb79dfce8d | enum | opts=[(151, 'bad'), (152, 'average'), (153, 'great')]; 'IT Administrator' | bb577e596de0e52df31883215cfb0cf7dc569c5f | enum | opts=[(154, 'bad'), (155, 'average'), (156, 'great')]; Backend Developer 148-150, Frontend Developer 145-147, Tester 142-144. ZADANI.md:76 „endpoint pole přepisuje“; ZADANI.md:116 „nejspíš plní starý talentový test. Ověř to u Ondřeje.“; ZADANI.md:131 „ukázka, kterou člověk nezačal, nechává pole prázdné“. Na /cz/talentovy-test je data-tf-widget=xI7D1Y2d.

**Návrh:** Do plánu dát pravidlo: pro nezačatou ukázku pole vůbec neposílat, tedy žádné null. Zeptat se Ondřeje, jestli PNZ smí přepsat hodnotu ze starého testu, nebo má jen doplnit prázdné pole jako u ad_*, a jestli starý test zůstane v provozu. Klíče polí a id možností držet v konfiguraci endpointu, nehledat je podle názvu.

## Střední závažnost (60)

### T1: Prototyp sám porušuje pravidla pevných mezer, takže „1:1“ a typografie nejdou splnit zároveň

*rozpor, potvrzeno*

CLAUDE.md:6 a ZADANI.md:185 chtějí texty 1:1 s prototypem „včetně pevných mezer“. CLAUDE.md:8 zároveň chce U+00A0 za jednopísmennými slovy, mezi číslem a jednotkou a v tisících. Prototyp má 209 pevných mezer správně, ale na 16 místech v rozhraní je obyčejná mezera U+0020.

Jednopísmenná slova (5 míst):
- „Z toho … zaplatí úřad práce“ (1670)
- „Rezervace potvrzená: Út 3. 11. v 13:00.“ a „Vybráno: … v …“ (1066, 1067)
- „Splněno 14 z 21.“ (1092)
- „Mince: 2 z 5.“ (1375)

Číslo a jednotka nebo tisíce (11 míst):
- „Dotace až 35 000 Kč“ v úvodním pruhu (465)
- „57 600 Kč“ na kartě a v zadání úkolu (502, 543)
- „víc než 2 500 lidí“ (689)
- popisky grafu „7 až 10 h“ a další tři (893)
- „asi 5 minut“ u dalších prací (1725); karty na 503 přitom mají „5 minut“ s U+00A0
- tlačítka „0 %, 5 %, 10 %“ a text „včetně spropitného 10 %“ (1028, 1035)
- „3 dny v řadě“ (1089)
- „15 %“ u zabezpečení serveru (1529)
- „Čas: 1 min“ z mins() (1629)

Další místa: aria-label „Moje odznaky a výsledek“ (449) a texty jen pro Pipedrive, tedy „0 min 02 s“ z fmtDur() (1732, 1761) a „z kroku před nástrojem“ (1753).

Doslovný přenos tedy porušuje CLAUDE.md. Oprava by zase měnila texty bez souhlasu (CLAUDE.md:27).

**Doklad:** node evidence.js: 465 'Dotace[20]až[20]35[20]000[20]Kč', 1670 'Z[20]toho[20]', 503 '5[A0]minut' proti 1725 'asi[20]5[20]minut'. Vyrenderovaný DOM v Edge 156 headless (␣ = U+0020, ‧ = U+00A0): 'Z␣toho␣35‧000‧Kč␣zaplatí', 'Čas:␣1␣min', 'Zabezpečení␣serveru15␣%', 'Rezervace␣potvrzená:␣Út␣3.␣11.␣v␣13:00.', 'Splněno␣14␣z␣21.', '0␣%5␣%10␣%'.

**Návrh:** Požádat Ondřeje o jedno obecné rozhodnutí: oprava mezer (jen U+0020 na U+00A0, beze změny slov) je předem schválená a zapíše se do seznamu odchylek od prototypu.

V implementaci:
- texty v cs.json se zástupnými hodnotami („{n} min“, „{n} %“, „{done} z {total}“),
- jeden formátovač čísel a jednotek místo skládání řetězců v kódu,
- lint test nad cs.json i nad vyrenderovaným DOM.

Pokud Ondřej trvá na 1:1, je potřeba tato místa vést jako povolené výjimky, jinak test nepůjde splnit.

### T3: Věta „Ceny jsou v prototypu orientační.“ by se dostala k návštěvníkům

*mezera, potvrzeno*

Věta stojí na konci rozbalovacího textu „Jak příspěvek funguje a jak o něj požádat“ (1678), který návštěvník vidí ve výsledku. ZADANI.md:17-20 ji mezi tím, co se nepřebírá, neuvádí; jmenuje jen štítek Prototyp a poznámku v patičce. ZADANI.md:179 navíc říká „Texty o příspěvku přeber z prototypu beze změny“. Podle CLAUDE.md:27 ji nemůžu sám vypustit, doslovný přenos ale ukáže na webu slovo prototyp.

**Doklad:** prace-na-zkousku.html:1678 '…O příspěvku rozhoduje úřad práce. Ceny jsou v prototypu orientační.</p>'. Vyrenderovaný text #r-fine v Edge končí 'rozhoduje␣úřad␣práce.␣Ceny␣jsou␣v‧prototypu␣orientační.'

**Návrh:** Zeptat se Ondřeje, jestli větu vypustit, nebo čím ji nahradit, a doplnit ji do seznamu v kapitole 2. Zbytek odstavce („Limit 35 000 Kč platí … do konce roku 2028. O příspěvku rozhoduje úřad práce.“) ponechat.

### T4: Hodnota „Vstup“ pro poznámku v Pipedrivu popisuje hash odkazy, které widget mít nebude

*mezera, potvrzeno*

Poznámka na dealu má obsahovat vstup (ZADANI.md:140). Prototyp ho bere z mapy ENTRY (1730-1731):
- „reklama na datovou analýzu (odkaz #data)“
- „reklama na Claude Code (odkaz #ai)“
- „reklama na Game Developera (odkaz #hry)“
- „reklama na IT administrátora (odkaz #kyber)“
- „přímý odkaz na výsledek“

Widget ale vstup čte z ?ukazka= nebo z data-start (ZADANI.md:37, 42) a hash používat nesmí (ZADANI.md:47). Při přenosu 1:1 se do Pipedrivu zapíše nepravdivý údaj: odkaz #data nebude existovat a data-start na stránce kurzu není reklama. Vstup „výsledek“ už vůbec nenastane.

Payload nese jen klíč ukázky (entry: data, ZADANI.md:87), takže endpoint reklamu od stránky kurzu nerozliší.

**Doklad:** prace-na-zkousku.html:1730 data:'reklama na datovou analýzu (odkaz #data)'; :1731 vysledek:'přímý odkaz na výsledek'. ZADANI.md:42 '`?ukazka=data|ai|hry|kyber` (má přednost před `data-start`, kvůli odkazům z reklam)'.

**Návrh:** Dohodnout s Ondřejem nové texty, například „odkaz z reklamy (?ukazka=data)“, „stránka kurzu (data-start=data)“ a „úvodní obrazovka“. Do payloadu přidat zdroj vstupu (parametr v URL, atribut, výchozí hodnota), nebo potvrdit, že klíč ukázky stačí.

### T6: Odpověď „Spíš ne“ zůstane uložená a výsledek i opener ji pak připíšou jiné ukázce

*chyba-v-prototypu, potvrzeno*

S jedním odznakem se výsledek ptá „Bavilo tě to?“ a volba „Spíš ne“ uloží S.fav = 'none'. Po druhém odznaku otázka „Co tě bavilo nejvíc?“ volbu 'none' nenabízí a žádné tlačítko není zmáčknuté, uložená hodnota ale zůstane.

best() (1640) pak vybere jinou ukázku a renderResult (1687, 1690-1691) u ní napíše „Zatím ti nejvíc sedí“ a „Podle tvé odpovědi tě tahle práce moc nebavila.“ opener() (1741) pošle do Pipedrivu „Vidím, že vás ukázka „Stavění aplikací s AI“ moc nechytla.“ a řádek Nejvíc bavilo zní „nebavilo ho to“. Návštěvník přitom o ukázce s AI nic neřekl.

**Doklad:** Edge headless, proto-driven2.html?a (data vyřešená na 3. pokus, „Spíš ne“, pak AI se 2 úpravami): 'A2 tagline: Zatím␣ti␣nejvíc␣sedí', 'A2 h2: Stavění␣aplikací␣s‧AI', 'A2 desc: Podle␣tvé␣odpovědi␣tě␣tahle␣práce␣moc␣nebavila.…', 'A2 fav buttons pressed: Datová analýza=false, Stavění aplikací s AI=false, Nevím=false', 'A2 opener: …Vidím,␣že␣vás␣ukázka␣„Stavění␣aplikací␣s‧AI“␣moc␣nechytla.…'

**Návrh:** Když se změní počet hotových ukázek, odpověď 'none' smazat, nebo ji vázat na konkrétní ukázku. Do payloadu posílat fav jen s klíčem ukázky. Přidat na opener() unit test pro tento průběh.

### T9: Texty o příspěvku obsahují čísla natvrdo a počítají s DIGIkurzy u všech kurzů

*mezera, potvrzeno*

ZADANI.md:166 chce ceny v config.json a texty v cs.json, ZADANI.md:176 chce hranici počítat z konfigurace. Texty ale tytéž hodnoty opakují natvrdo:
- „Dotace až 35 000 Kč“ (465)
- „Příspěvek je 76,73 % ceny, ale nejvýš 35 000 Kč“ (1672)
- „také nejvýš 35 000 Kč“ (1677)
- „Limit 35 000 Kč … až do konce roku 2028“ (1678)
- „aspoň 80 % výuky“ (1676)
- „víc než 2 500 lidí“ (689)
- „až přes 38 000 Kč na zaměstnance“ (1708)

Když marketing v konfiguraci změní sazbu nebo strop, začne si cena s textem odporovat.

Pro digikurzy: false (ZADANI.md:177) prototyp žádné texty nemá a otázka 9.4 řeší jen cenu. U kurzu bez DIGIkurzů by přitom byly nepravdivé tyto části:
- úvodní pruh „Dotace až 35 000 Kč na kurz…“ (465), společný pro všechny kurzy,
- nadpis „Kurz … s příspěvkem“ (1665),
- štítek „Dotace“ (1669),
- odrážky o příspěvku (686),
- zaškrtávací políčko (687),
- rozbalovací text (1672-1678).

**Doklad:** prace-na-zkousku.html:465 '<span class=ptag>Dotace až 35 000 Kč</span>'; :1672 'Příspěvek je 76,73 % ceny, ale nejvýš 35 000 Kč.'; ZADANI.md:177 'Co ukázat při `false`, je otevřená otázka (kapitola 9).'

**Návrh:** V cs.json použít zástupné hodnoty ({strop}, {sazba}, {dochazka}) a plnit je z config.json stejným formátovačem jako ceny. K otázce 9.4 doplnit, které bloky se při digikurzy: false skryjí, co se ukáže místo nich a co bude s úvodním pruhem. Nové texty nechat schválit.

### T12: Drobné chyby v textech ukázek, které by se přenesly 1:1

*chyba-v-prototypu, castecne*

(a) Hra volí předložku podle seznamu [2, 3, 4, 7] (1375). Mřížka má 12 × 7 polí (1190), vlastní level tedy může mít desítky mincí a „z“ se chybně vypíše u 6, 12, 13, 14, 16, 17, 20 až 49 a 70 až 79 („Mince: 6 z 6“). (b) Rezervační ukázka má pevná data „Po 2. 11.“, „Út 3. 11.“, „St 4. 11.“ (1008, 1050) a log kyberbezpečnosti „Mon Oct 26“, „Tue Oct 27“ (1489-1491). Dny v týdnu sedí jen v roce 2026 a k 29. 10. 2026 zbývá týden, než ukázka začne nabízet minulé termíny.

**Doklad:** prace-na-zkousku.html:1375 '([2, 3, 4, 7].includes(total) ? ' ze ' : ' z ')'. node: '2026 2.11. po 3.11. út 4.11. st | 26.10. Mon 27.10. Tue' a '2027 2.11. út 3.11. st 4.11. čt | 26.10. Tue 27.10. Wed'.

**Návrh:** (a) Volit „z“ nebo „ze“ podle výslovnosti čísla, nebo zobrazit „Mince: 6/6“ (změna textu ke schválení). (b) Data počítat od dnešního dne, nebo dny v týdnu vynechat; rozhodne Ondřej.

### Z2: Datová analýza: stav neodliší třetí pokus od odpovědi, kterou ukázal nástroj

*chyba-v-prototypu, potvrzeno*

Podle tabulky v kap. 4 je average „vyřešeno na 2. nebo 3. pokus“ a bad „správnou odpověď ukázal nástroj po třech chybách“. Oba stavy ale končí s tries = 3 a firstTry = false a S nemá žádný příznak odhalení. Z tries v payloadu je tedy rozlišit nejde. why() navíc v obou případech píše „Detektivka vyřešená na 3. pokus“. Do poznámky na dealu a do výsledku by se tak dostala nepravda a hodnocení Data Analyst by mohlo být chybné.

**Doklad:** ř. 953 až 970 (cesta s odhalením volá finishData() bez příznaku), ř. 1648 `'Detektivka vyřešená na ' + st.tries + '. pokus'`. Headless reveal: 'after 3 wrong: tries 3 firstTry false done true correct marked ok true', 'why(data) ["Detektivka vyřešená na 3. pokus", ...]'. ZADANI ř. 135, ř. 95 (payload má jen tries).

**Návrh:** Přidat do stavu i payloadu příznak revealed: true/false a bad počítat jen podle něj. Pro tento případ připravit text ve why(), třeba „Správnou odpověď ukázal nástroj“; text schválí Ondřej. Na to napsat unit test.

### Z3: Školení přes firmu zůstane zaškrtnuté po změně cíle a „No“ se zapíše i u nepoložené otázky

*chyba-v-prototypu, potvrzeno*

Zaškrtávátko „Zajímá mě školení přes firmu“ se ukazuje jen u cíle upskill. Po přepnutí na „Chci změnit obor“ zmizí, ale S.firm zůstane true a panel dál hlásí „zajímá ho, předat LifeScale Business“. ZADANI chce tenhle signál na první řádek poznámky, takže by šlo o falešné předání. Podobně nízkopříjmová skupina: otázka se ukáže jen u Claude Code. U ostatních tří kurzů se nikdy nezobrazí, přesto do Pipedrivu odejde lowIncome false, tedy „No“. Po přepnutí doporučení na dražší kurz zůstane zaškrtnutí skryté a nejde zrušit. „Ne“ tak v datech znamená i „neptali jsme se“.

**Doklad:** ř. 1706 až 1714 (checkbox jen při upskill), ř. 1720 (změna cíle S.firm neresetuje), ř. 761 (výchozí hodnoty false), ř. 1759 a 1762 (panel „ne“). Headless firm: 'after switching goal to switch: S.firm true goal switch #r-firm present false row Školení zajímá ho, předat LifeScale Business row Cíl změnit obor'. Headless lowinc: 'after fav=data: ... lowinc label hidden true S.lowIncome true row ano'. ZADANI ř. 127 až 128, 144.

**Návrh:** Posílat firmInterest = firm && goal === 'upskill', nebo firm při změně cíle vynulovat. U firmInterest a lowIncome zavést třetí stav null pro nepoloženou otázku a pole v Pipedrivu pak nechat prázdné. S Ondřejem potvrdit, jestli lowIncome platí pro osobu, nebo jen pro zobrazený kurz.

### Z5: Payload nemá úplné schéma: ai, kyber, kódování fav, stavy a časy

*mezera, potvrzeno*

Endpoint má podle zadání přijímat jen známá pole, ale příklad pokrývá jen data (tries, viewsSeen, seconds) a hry (plays, edits). Pro ai (idea, changes, ideasTried) a kyber (firstOk, mistakes) žádná pole nejsou. fav má v prototypu čtyři podoby: undefined (bez odpovědi, JSON.stringify klíč zahodí), null (Nevím), 'none' (Spíš ne) a klíč ukázky. Podoba v JSON určená není. Hodnota „data“ přitom znamená jednou „bavilo mě to“ u jediné ukázky a jindy „bavilo nejvíc“ z několika. Stav in_progress vzniká už pouhým otevřením obrazovky. Při ?ukazka nebo data-start se obrazovka otevře sama při načtení, takže bez jediné akce vznikne „rozpracováno“ a začne běžet čas (na stránce kurzu i když widget ještě není vidět). secondsTotal je čas od prvního otevření do teď a roste i při nečinnosti. viewsSeen začíná na 1. Bez odznaku se jako „první věta“ posílá „Návštěvník zatím nic nedokončil.“

**Doklad:** ZADANI ř. 83 až 102. Prototyp ř. 763 (S.ai), 765 (S.kyber), 761 a 1717 a 1752 (hodnoty fav), 793 až 797 (t0 při zobrazení), 1735 (rozpracováno = t0), 1761 (Date.now() − firstAt), 984 (seen = {mesice}), 1739. Headless entrydata (#data): 'data.t0 set true firstAt set true', panel 'Datová analýza rozpracováno' bez interakce.

**Návrh:** Před fází 5 napsat schéma (typy TypeScript a ruční validaci, bez nové závislosti) se všemi poli pro všechny ukázky. fav jako enum data|ai|hry|kyber|none|unknown nebo null, plus kontext (počet hotových ukázek). Status not_started|in_progress|done|skipped, kde in_progress vzniká až první akcí. seconds jako aktivní čas jen při viditelném widgetu, s horní mezí. Když není odznak, opener neposílat. Schéma dát Ondřejovi ke schválení.

### Z6: Přenos 1:1 do Shadow DOM rozbije navigaci, vyzvednutí odznaku i fokus v okně

*riziko, potvrzeno*

ZADANI píše, že prototyp „stačí rozdělit do modulů“. Prototyp ale navigaci (data-go), vyzvednutí odznaku (data-claim) i klávesy deleguje přes posluchače na document a čte e.target.closest(). V Shadow DOM je e.target na úrovni document přesměrovaný na hostitele, takže closest() vrátí null. Past na fokus používá document.activeElement, který v Shadow DOM ukazuje na hostitele, takže Tab skočí vždy na první tlačítko. Kód navíc měří okno, ne widget: FAB se skryje při window.innerWidth ≥ 880, i když je widget v úzkém sloupci. Plátno počítá s window.innerHeight × 0,48. reveal() používá scrollIntoView({block:'start'}), takže cíl skončí pod lepicí hlavičkou, a data-scroll-offset v ZADANI je jen pro přepnutí obrazovky.

**Doklad:** Prototyp ř. 784 až 791, 852 až 862, 863 až 869, 1364 až 1365, 927, 1268, 818. Headless shadow.html: 'document-level delegated click: closest() returned null, e.target=X-W', 'document.activeElement=X-W, shadowRoot.activeElement=Můj výsledek', 'prototype trap index from document.activeElement: -1 -> next focus would be Další práce (expected Zůstat tady)'. ZADANI ř. 58.

**Návrh:** V plánu fáze 3 výslovně: posluchače vázat na shadowRoot nebo číst e.composedPath(), fokus brát z shadowRoot.activeElement, šířku widgetu sledovat přes ResizeObserver, scroll-margin-top nastavit podle data-scroll-offset i pro reveal() a FAB. Na test-host.html přidat testy kliků, Tabu a posunů.

### Z7: CORS jen pro coderslab.cz koliduje se samostatnou stránkou a beacon ho obchází

*rozpor, castecne*

CORS jen pro coderslab.cz (ZADANI.md:74) nestačí, pokud samostatná stránka poběží na jiné doméně (otázka 9.1); pak je nutné její origin přidat do seznamu. Seznam CORS navíc nechrání endpoint: sendBeacon s text/plain (ZADANI.md:79) je jednoduchý požadavek bez preflightu, takže endpoint musí hlavičku Origin ověřovat sám u každého požadavku.

**Doklad:** ZADANI ř. 55, 72, 74, 79, 214. Lokální test (beacon-server.js bez hlaviček CORS a stránka z file://): 'OPTIONS /api/pnz?via=fetch-json origin=null', 'POST /api/pnz?via=beacon origin=null ct=text/plain;charset=UTF-8 body={"token":"t"}', na stránce 'fetch json error: Failed to fetch'.

**Návrh:** Spolu s otázkou 9.1 rozhodnout, odkud poběží samostatná stránka. Ideálně z cesty na coderslab.cz, jinak její origin přidat do seznamu přes proměnnou prostředí. Endpoint ať ověřuje hlavičku Origin u každého požadavku včetně text/plain a widget ať posílá jednotně text/plain bez preflightu.

### Z8: Pravidla hodnocení nepokrývají rozpracované a sporné stavy

*mezera, castecne*

Tabulka hodnocení nepokrývá rozpracované stavy (data bez odpovědi, AI bez úpravy, kyber rozpracovaná, hra bez výhry a bez přeskočení). V prototypu dává odznak hry bez přeskočení jen výhra s edits > 0 (1380-1384), takže average a bad vznikají jen přeskočením: po výhře ve výchozím levelu average, bez výhry bad. Sporné zůstává dohrání vlastního levelu po přeskočení (great proti bad). „Výchozí level“ (1465) nenuluje edits, takže výhra ve výchozím levelu po resetu se počítá jako vlastní a dává great. AI bad („bez úprav“) je stav bez odznaku.

**Doklad:** ZADANI ř. 131 až 138. Prototyp ř. 1465 (reset nesahá na S.hry.edits), 1380 až 1384 (výhra s edits > 0 = vlastní level), 1353, 1466, 1175. Headless aimark: 'at markDone (first change): changes 1 done true'.

**Návrh:** Doplnit úplnou tabulku: rozpracovaná ukázka má rating null (kromě případů výslovně uvedených u AI bad a hry average), přeskočení po výchozí výhře je average, vlastní výhra má přednost před přeskočením. Při resetu nulovat edits nebo porovnávat mřížku s výchozí. Tabulku dát Ondřejovi ke schválení a pokrýt unit testy.

### Z9: Stavění s AI: úpravy se sčítají přes nápady a počítají se i nedokončené

*chyba-v-prototypu, potvrzeno*

buildIdea() při novém nápadu nenuluje S.ai.changes a applyChange() přičte úpravu ještě před kontrolou, jestli běh nebyl zrušen. Po dvou úpravách „Dělení útraty“ a postavení „Tracker návyků“ věta tvrdí, že tracker dostal 2 úpravy. Klik na úpravu a hned přepnutí nápadu přičte další úpravu, která se nikdy neprovede. Hodnocení great tak lze dostat bez dvou úprav jedné aplikace. S.ai.idea se nastaví už při kliknutí, takže hotová aplikace se nedá odlišit od rozestavěné.

**Doklad:** Prototyp ř. 1125, 1162 až 1165. Headless aicross: 'after building navyky: changes 2 ideaName Tracker návyků ... a⍽dostal od vás 2 úpravy', 'after clicking a change on navyky and switching idea immediately: changes 3 ideaName Rezervační systém ... 3 úpravy'. Headless aimark: '10 ms after clicking a new idea: S.ai.idea navyky ... app text Agent pracuje…'.

**Návrh:** Počítat úpravy po nápadech a přičítat je až po provedení, přidat příznak built. S Ondřejem rozhodnout, jestli hodnocení a věta do telefonu platí pro poslední, nebo pro nejlépe upravený nápad.

### Z10: Odpověď „Spíš ne“ se po další ukázce přenese na jinou práci

*chyba-v-prototypu, potvrzeno*

U jediné hotové ukázky „Spíš ne“ uloží S.fav = 'none'. Po dokončení další ukázky se otázka změní na výběr z ukázek, žádné tlačítko není aktivní, ale 'none' zůstane. Doporučí se jiná ukázka podle skóre a výsledek o ní napíše „Podle tvé odpovědi tě tahle práce moc nebavila“. Věta do telefonu zní „Vidím, že vás ukázka „Kyberbezpečnost“ moc nechytla“, přitom odpověď patřila datové analýze. Podobně „Ano“ u jedné ukázky později vyjde jako „Bavilo tě to ze všeho nejvíc“.

**Doklad:** Prototyp ř. 1687, 1693, 1700 až 1701, 1715 až 1719, 1741. Headless favnone: 'after 2nd path: S.fav none tagline Zatím ti nejvíc sedí h2 Kyberbezpečnost desc Podle tvé odpovědi tě tahle práce moc nebavila...', 'fav buttons [Datová analýza:false, Kyberbezpečnost:false, Nevím:false]', 'opener ... Vidím, že vás ukázka „Kyberbezpečnost“ moc nechytla.'

**Návrh:** Ukládat fav i s ukázkou, ke které odpověď patří, a při změně počtu hotových ukázek ho vynulovat, nebo se zeptat znovu. Pokrýt testem.

### Z11: Vstup (ENTRY) a jeho popisky ve widgetu neplatí

*rozpor, potvrzeno*

Prototyp bere vstup z hashe a popisky říkají „reklama na datovou analýzu (odkaz #data)“ apod. Ve widgetu přijde vstup z ?ukazka (reklama) nebo z data-start (stránka kurzu, žádná reklama), odkazy s hashem už neexistují a vstup „vysledek“ nejde dosáhnout. Poznámka by tak obchodu tvrdila, že člověk přišel z reklamy, i když vložil widget na stránce kurzu. Bonus 1,5 za vstup přitom téměř vždy rozhodne o doporučení, takže zdroj vstupu je důležitý.

**Doklad:** Prototyp ř. 778 až 781, 1730 až 1731, 1642. ZADANI ř. 37, 42, 140. Headless entrydata: 'sales Vstup reklama na datovou analýzu (odkaz #data)'.

**Návrh:** Posílat entry i entrySource (ukazka|data-start|default) a cestu stránky (location.pathname). Nové popisky do poznámky připravit a dát Ondřejovi ke schválení.

### Z12: Analytika: nejasné spouštěče a parametry událostí

*mezera, potvrzeno*

Pro každý typ výzvy existuje prvek: webinar a minikurz (ř. 1722), detail_kurzu (1723), konzultace (695, odkaz v „Co dál“), skoleni_firmy (1710). Nejasné ale je:
- pnz_task_start: otevření obrazovky, nebo první akce? Při ?ukazka a data-start by se spustil sám.
- pnz_task_complete u přeskočení a hodnocení AI v okamžiku dokončení (skoro vždy average).
- pnz_game_death.count: S počítadlo pádů nemá.
- pnz_badge_claim: u přeskočení se nespustí, odznak se přitom ukáže.
- pnz_answer: řádek „question: fav, goal, firm, lowincome, value“ jde číst dvojím způsobem, chybí kódování value pro null a none a názvy se liší od payloadu (lowincome vs lowIncome, firm vs firmInterest).
- „Klik na další krok“ v trychtýři: nepočítá se k němu i detail_kurzu?

**Doklad:** ZADANI ř. 150 až 162. Prototyp ř. 793 až 797, 872 až 882, 1466, 764 (S.hry bez počtu pádů), 1340, 863 až 869, 695, 1710, 1722 až 1723. Headless aimark: 'at markDone (first change): changes 1'.

**Návrh:** Udělat tabulku událostí se spouštěčem v kódu: task_start při první akci, value jako řetězec z enumu fav, přidat čítač pádů, určit, které výzvy jsou „další krok“. Schválí Ondřej.

### Z13: Čísla z konfigurace jsou natvrdo v textech

*mezera, potvrzeno*

Strop 35 000 Kč a sazba 76,73 % jsou napsané přímo v textech: pruh na úvodu, podrobnosti o příspěvku (třikrát strop a jednou sazba) a hranice 45 615 Kč v kódu. Když marketing změní config.json, texty a výpočet se rozejdou. Jinak pevná čísla jsou „víc než 2 500 lidí“ a „až přes 38 000 Kč na zaměstnance“.

**Doklad:** Prototyp ř. 465 „Dotace až 35 000 Kč“, 1672 „Příspěvek je 76,73 % ceny, ale nejvýš 35 000 Kč“, 1677, 1678 „Limit 35 000 Kč platí ... do konce roku 2028“, 1660 (0.7673, 35000), 1666 (45615), 689, 1708. ZADANI ř. 166, 176.

**Návrh:** V cs.json používat zástupné znaky ({strop}, {sazba}) plněné z konfigurace a formátované přes cs-CZ s pevnými mezerami. Zaškrtávátko ukazovat, když se liší priceFor s nízkopříjmovou skupinou a bez ní, ne podle konstanty. Test, že vykreslené texty obsahují hodnoty z konfigurace.

### Z14: „Texty 1:1“ koliduje s pravidlem pevných mezer: prototyp je nemá všude

*rozpor, potvrzeno*

Prototyp má 209 pevných mezer, ale na několika viditelných místech jsou obyčejné mezery:
- pruh „Dotace až 35 000 Kč“ (oddělovač tisíců i mezera před Kč);
- „57 600 Kč“ v datové úloze;
- „víc než 2 500 lidí“ (na mobilním screenshotu se zalomí mezi 2 a 500);
- „Z toho …“, „asi 5 minut“, „Splněno X z Y“, „Mince: X ze Y“, „… v 13:00“.
Převzetí 1:1 tedy porušuje CLAUDE.md, oprava zase „mění text bez souhlasu“. Opačně: příklad věty v payloadu v ZADANI má obyčejné mezery, prototyp pevné, takže unit test proti řetězci ze ZADANI selže.

**Doklad:** Kódové body: ř. 465 'Dotace|SP|až|SP|35|SP|000|SP|Kč', 502 a 543 '57|SP|600|SP|Kč', 689 'než|SP|2|SP|500|NBSP|lidí', 1670 'Z|SP|toho', 1725 'asi|SP|5|SP|minut', 1092 a 1375 a 1066. Screenshot mobil-vysledek.png zalomí „2 / 500 lidí“. ZADANI ř. 101 (0 znaků U+00A0) vs prototyp ř. 1742 'a⍽to', 's⍽daty'. ZADANI ř. 185, CLAUDE.md.

**Návrh:** Požádat Ondřeje o souhlas opravovat jen mezery (bez změny slov) a přidat lint na jednopísmenná slova a čísla s jednotkou. V testech věty porovnávat s pevnými mezerami.

### Z15: Aktivita „Zavolat“: kap. 4 ji přiděluje vlastníkovi dealu, kap. 9 to má jako otevřené

*rozpor, potvrzeno*

Kap. 4 rozhoduje „přiřazená vlastníkovi dealu“, otevřená otázka 9.5 se ptá na totéž. U termínu „po 17. hodině další pracovní den“ chybí časové pásmo (serverless běží v UTC) a svátky. Není definované „aspoň jeden odznak“: hotová ukázka, vyzvednutý odznak, a počítá se přeskočená hra? Panel prototypu píše o „leadu“, ZADANI páruje na deal. Pokud formulář z reklamy zakládá v Pipedrivu lead, hledání dealu podle tokenu selže (neověřeno).

**Doklad:** ZADANI ř. 142, 218, 63, 65. Prototyp ř. 1753 'výsledky se připíšou k jeho leadu v Pipedrivu', ř. 1466.

**Návrh:** Jako výchozí ponechat vlastníka dealu a otázku 9.5 brát jako potvrzení. Termín počítat v Europe/Prague a vynechávat víkendy, svátky podle rozhodnutí. „Odznak“ definovat jako status done bez přeskočení. K otázce 9.3 přidat dotaz, jestli formulář zakládá deal, nebo lead.

### Z16: Kritéria vzhledu: screenshoty obsahují prvky, které se nepřebírají, a embed nemá předlohu

*rozpor, potvrzeno*

Shoda se screenshoty se má ověřit snímky Playwright. Screenshoty ale obsahují štítek „PROTOTYP“, panel „Pohled obchodníka“ a poznámku v patičce, které se podle kap. 2 nepřebírají. Výsledek proto pixelově shodný být nemůže a celostránkové snímky výsledku změní výšku. Světlý pruh s odznaky pro data-variant=embed nemá v prototypu ani ve screenshotech předlohu. Tlačítko Hrát je na 1366 × 768 vidět jen v samostatné stránce: v embedu pod lepicí hlavičkou 176 px vychází spodek tlačítka asi na 814 px a plátno se počítá z celé výšky okna. Plátno má DPR omezené na 2, na telefonech s DPR 3 tedy není plně ostré.

**Doklad:** Screenshoty notebook-uvod.png, notebook-vysledek.png (1366×1037) a mobil-vysledek.png (780×4464) ukazují PROTOTYP, Pohled obchodníka a patičku. ZADANI ř. 14, 17 až 20, 36, 184, 193. Headless hry1366: 'header bottom 56 play bottom 694 viewport 768' (odhad pro embed 176 + 638 = 814, neověřeno). Prototyp ř. 1268, 1270 `dpr = Math.min(window.devicePixelRatio || 1, 2)`. Headless při DPR 3: 'canvas css 316px 184.333px canvas px 632x369'.

**Návrh:** Určit povolené rozdíly (maskované oblasti) a po schválení vzhledu embedu vytvořit nové referenční snímky. Kritérium pro Hrát formulovat zvlášť pro embed: výšku plátna počítat z výšky okna minus data-scroll-offset. Strop DPR zvednout na 3, nebo kritérium upřesnit.

### A1: z-index 2000 na coderslab.cz nestačí, překryvy patří do top layer

*chyba-v-zadani, potvrzeno*

Zadání počítá s tím, že z-index aspoň 2000 dostane okno s odznakem, plovoucí tlačítko a konfety nad hlavičku, lištu cookies i poradce. Mobilní spodní navigace webu má ale z-index 5000 a výšku 70 px. Tlačítko „Znám viníka“ (bottom 16 px, výška 44 px, ukazuje se jen pod 880 px) by na mobilu leželo celé pod ní, a navigace by zůstala i nad ztmaveným pozadím okna. Lišta cookies má také 2000 a widget nad ní vyhraje jen proto, že je v DOM až za ní. Z-index navíc nepomůže, když nějaký předek widgetu na stránce vytvoří stacking context, a fixed se rozbije, když má předek transform, filter nebo will-change. Samotné container-type containing block nevytváří, s tím problém není. Hlavička webu má ve skutečnosti z-index 1020, ne 1030.

**Doklad:** Edge 156 na coderslab.cz/cz/kurzy/data-analyst: nav.mobile-nav fixed top 774 bottom 844 z 5000, div#cookie-notice fixed z 2000 (v HTML na bajtu 4295, před obsahem); styles.css: .mobile-nav{background:#000000;position:fixed;bottom:0;height:70px;width:100%;...;z-index:5000}; prototyp 204 .fab{position:fixed; ... bottom:calc(16px + env(safe-area-inset-bottom, 0px)); z-index:20, 418 a 431; embed-mechanics.html: overlay z-index 2000 v main{position:relative; z-index:1} vrací elementFromPoint = hdr, dialog.showModal() pod předkem s transform vrací hostE; ZADANI.md:49.

**Návrh:** Okno s odznakem udělat jako dialog otevřený přes showModal() (top layer nad vším bez ohledu na předky) a plátno s konfetami vložit dovnitř dialogu. Plovoucí tlačítko dát do top layer přes popover=manual (fallback z-index 2147483000) a přidat atribut se spodním odstupem, na mobilu coderslab.cz 70 px. Překryvy držet jako přímé potomky shadow root. Do test-host.html přidat spodní navigaci se z-index 5000, lištu cookies se z-index 2000 a předka se z-index a transform. Opravit text v kapitole 3.

### A2: Odstup 176 px neodpovídá webu a reveal() schová obsah pod hlavičku

*chyba-v-zadani, potvrzeno*

Lepicí hlavička na stránce kurzu je při 1366 px vysoká 199 px (60 + 58 + podmenu 80 px). Na stránce bez podmenu má 118 px a pod 992 px šířky nahoře není nic lepicího, je jen fixní navigace dole. Pevných 176 px tak na kurzu schová horních 23 px widgetu a na mobilu nechá nahoře zbytečnou mezeru 176 px. Prototyp k tomu: show() volá window.scrollTo(0, 0), což web s Bootstrapem animuje (smooth na :root), a reveal() posouvá s block start na horní hranu okna, tedy pod hlavičku. Podmínka r.bottom < 80 o hlavičce neví. Web nemá scroll-padding-top, který by to vyrovnal.

**Doklad:** Měření v Edge 156 (fakt 14); prototyp 776 window.scrollTo(0, 0); 818 if (r.top > window.innerHeight * 0.55 || r.bottom < 80) el.scrollIntoView({ ... block:'start' }); embed-mechanics.html: bez scroll-margin [0, 176], se scroll-margin-top uvnitř shadow 176, scrollY po window.scrollTo(0,0) zůstalo 1500; styles.css @media (prefers-reduced-motion: no-preference){:root{scroll-behavior:smooth}}; scroll-padding-top auto; ZADANI.md:39 výchozí 176 (60 + 59 + 56).

**Návrh:** Odstup počítat za běhu. Výchozí data-scroll-offset=auto sečte výšky viditelných sticky a fixed prvků nahoře (třeba podle selektoru v atributu), číslo zůstane jako ruční přepis, přepočet při resize. Přepnutí obrazovky dělat přes window.scrollTo({ top, behavior: 'instant' }), cílům reveal() dát scroll-margin-top: var(--pnz-offset) a podmínku změnit na r.bottom < odstup + 80. Ondřej potvrdí, na kterých stránkách widget bude.

### A3: V embedu nebude tlačítko Hrát na 1366 x 768 vidět bez posunu

*rozpor, castecne*

Kritérium ZADANI.md:193 neříká, jestli platí i pro embed. Na samostatné stránce prototyp splní 694 px z 768. Pod lepicí hlavičkou webu vyjde spodek tlačítka Hrát na 814 px (hlavička 176 px) až 837 px (199 px na stránce kurzu), k tomu výška světlého pruhu s odznaky. Výška plátna se počítá z celého window.innerHeight (ř. 1268). V embedu lze plátno počítat z místa pod hlavičkou a se screenshoty samostatné stránky to není v rozporu. Ondřej potvrdí, zda kritérium platí i pro embed.

**Doklad:** proto-game-measure.html v Edge 156 s vnitřním rozměrem 1366x768: header h 56, canvas 632x369, play bottom 694; notebook-hra.png (Hrát zhruba na y 650 až 694); prototyp 1268 const tile = Math.min(w / COLS, (window.innerHeight * 0.48) / ROWS); ZADANI.md:39 a 193.

**Návrh:** Rozhodnout, jestli kritérium platí jen pro samostatnou stránku. Doporučení: v embedu počítat dlaždici z (innerHeight - odstup - výška pruhu), kritérium v embedu testovat na test-host.html s tímto výpočtem a pro samostatnou stránku nechat 0,48 kvůli screenshotu.

### A4: Prototyp přenesený 1:1 do Shadow DOM přestane reagovat na kliky i Tab

*riziko, potvrzeno*

Delegace kliků visí na document a hledá e.target.closest('[data-go]') a '[data-claim]'. Ze shadow root dorazí událost s cílem přeznačeným na hostitele, closest vrátí null a všechna tlačítka navigace i vyzvednutí odznaku přestanou fungovat. Past fokusu v okně porovnává document.activeElement, který je ve shadow DOM hostitel, takže index vyjde -1. Tab pak skáče pořád na „Další práce“, Shift+Tab na „Můj výsledek“ a „Zůstat tady“ z klávesnice nejde. $ a $$ hledají v document a vrátí null. Kapitola 8 dává přenos do modulů (krok 2) před custom element a Shadow DOM (krok 3), takže by se všechny moduly přepisovaly dvakrát.

**Doklad:** prototyp 724-725 (el || document).querySelector(s); 784-785 document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); 863-864; 858 const i = f.indexOf(document.activeElement); embed-mechanics.html: [hostC, null, b1], [hostC, b1], index -1; ZADANI.md:205-206.

**Návrh:** Kostru custom elementu se shadow root (mode open) postavit hned v kroku 2 a samostatnou stránku vykreslovat stejným elementem s data-variant=standalone, aby se screenshoty ověřovaly na skutečném výsledku. $ a $$ vázat na shadowRoot, posluchače dávat na shadowRoot, cíl brát z e.composedPath()[0] a fokus číst ze shadowRoot.activeElement. Odkazy v hlavičce href=#start a href=#vysledek (447, 449) převést na data-go.

### A9: Ubuntu Mono web nenačítá a @font-face ve shadow root nefunguje

*otazka, potvrzeno*

Web načítá jen Open Sans a Ubuntu, Ubuntu Mono ne. Terminály, ukázka SQL a příkazy v kyberbezpečnosti (var(--mono)) by v embedu spadly na Consolas nebo jiné systémové písmo a neodpovídaly by screenshotům. Uvnitř widgetu písmo načíst nejde, protože Edge @font-face ve shadow root ignoruje, a vložení link do head stránky je zásah do hostitele. Drobný rozpor: CLAUDE.md uvádí Ubuntu Mono ve hře, ale plátno kreslí písmem Ubuntu a na načtení písma nečeká. Při vstupu rovnou do hry tak může první snímek „Tady skoč!“ vyjít v Arialu.

**Doklad:** styles.css coderslab.cz: @import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Ubuntu:wght@400;500;700&display=swap"), Ubuntu Mono 0 výskytů; embed-mechanics.html: šířky ShadowFace / Times / Courier [89, 89, 192], ShadowFace v document.fonts není; prototyp 29, 192, 241, 315; 1254 ctx.font = '700 0.42px "Ubuntu", Arial, sans-serif'; 1260; CLAUDE.md: ve hře a terminálu Ubuntu Mono.

**Návrh:** Ondřej vybere: a) web přidá Ubuntu Mono do svého @import, b) widget v embedu vloží jeden link do head jako výjimku z pravidla o hostiteli, c) přijmout náhradní písmo. Plátno po document.fonts.load('700 16px Ubuntu') překreslit. V CLAUDE.md opravit písmo hry.

### A10: Klávesnice hry: posluchač na celé stránce a klávesy 1 až 4 na české klávesnici

*riziko, potvrzeno*

Skok mezerníkem a šipkou nahoru visí na document. Během hry tak chytá klávesy z celé stránky webu, i z polí mimo widget. Kdyby se nové ovládání editoru (šipky, Enter, mezerník, 1 až 4) navázalo stejně, editor by po celou dobu úprav bral webu šipky a mezerník, kterými se stránka posouvá. Na české klávesnici QWERTZ dávají klávesy 1 až 4 bez Shiftu znaky + ě š č, takže test e.key === '1' nebude fungovat. Pořadí dílků v liště je Plošina 1, Bodce 2, Mince 3 a Guma 0, klávesa 4 tedy musí odpovídat hodnotě 0. Plátno nemá tabindex ani kurzor a jeho popisek mluví jen o klepání. Nové texty k ovládání klávesnicí potřebují souhlas.

**Doklad:** prototyp 1455-1458 document.addEventListener('keydown', e => { if (!visible || mode !== 'play') return; if (e.code === 'Space' || e.code === 'ArrowUp'){ e.preventDefault(); jump(); } }); 619-622 data-tool 1, 2, 3, 0; 625 canvas bez tabindex; ZADANI.md:194; rozložení české klávesnice: neověřeno v tomto prostředí.

**Návrh:** Editor ovládat jen tehdy, když má fokus plátno (tabindex=0, role a popisek). preventDefault pro šipky a mezerník volat jen tam, číslice číst z e.code (Digit1 až Digit4, Numpad1 až Numpad4), klávesu 4 mapovat na Gumu a kurzor kreslit v draw(). Skok omezit na události, jejichž composedPath obsahuje widget. Texty nápovědy předložit Ondřejovi.

### A12: Vstup z data-start se v poznámce vydává za reklamu

*rozpor, potvrzeno*

Prototyp zná vstup jen z hashe a popisky ho vykládají jako reklamu s odkazem #data. Widget bere vstup z ?ukazka (reklamy) i z data-start (umístění na stránce kurzu). Návštěvník ze stránky Datový analytik s data-start=data by obchodníkovi přišel jako „reklama na datovou analýzu (odkaz #data)“. Payload má jen jedno pole entry.

**Doklad:** prototyp 1730-1731 data:'reklama na datovou analýzu (odkaz #data)'; 780 S.entry = VIEWS.includes(h) ? h : 'start'; ZADANI.md:37, 42 a 86.

**Návrh:** Do payloadu přidat zdroj vstupu (ukazka, data-start, výchozí) a nové popisky pro poznámku předložit Ondřejovi ke schválení.

### A13: Vzhled embedu nemá předlohu: světlý pruh s odznaky a vložení do kontejneru webu

*mezera, potvrzeno*

Zadání chce v embedu světlý pruh s ukazatelem odznaků. Prototyp ani screenshoty ho nemají: všechny screenshoty ukazují samostatnou stránku s tmavou hlavičkou a štítkem Prototyp a styly .prog počítají s tmavým pozadím. Výška pruhu navíc ovlivní, jestli je vidět tlačítko Hrát. Není také řečeno, jestli widget leží uvnitř .container webu. Prototyp má vlastní .container (nejvýš 1110 px, okraje 16 px) a modrý pás přes celou šířku. Uvnitř bootstrapového .container (okraje 12 px) by se okraje sčítaly, na 390 px by zbylo 334 px obsahu místo 358 px, a pás by přestal vést přes celou šířku.

**Doklad:** ZADANI.md:36; prototyp 60-68 (.prog a .mini s rgba(255,255,255,...)), 44 .container{max-width:1110px; ... padding-left:max(16px, ...)}, 89 .band-sky; screenshoty notebook-hra.png a mobil-odznak.png s tmavou hlavičkou; styles.css coderslab .container,...{--bs-gutter-x: 1.5rem;...;padding-right:calc(var(--bs-gutter-x) * .5)}.

**Návrh:** Poprosit Ondřeje o náčrt pruhu. Výchozí návrh: světlé pozadí, odznaky ve stylu .badge a odkaz „Odznaky n/4“ na výsledek. V embedu vypnout vlastní max-width a okraje .container a doporučit vkládání mimo .container webu, test-host.html to zafixuje.

### A14: Ukázka Stavění s AI si drží stav mezi nápady

*chyba-v-prototypu, potvrzeno*

Stav malých aplikací žije v uzávěrách a buildIdea ho nenuluje. Kdo u „Dělení útraty“ přidá spropitné, vybere 10 % a aplikaci postaví znovu, uvidí částky se spropitným, přestože tlačítka spropitného chybí, a nabídku „Přidej spropitné“ dostane znovu. Počet úprav S.ai.changes se sčítá přes všechny nápady. Výsledek i první věta do telefonu ho pak připíšou poslední aplikaci, a to se dostane i do Pipedrivu.

**Doklad:** proto-ai-leak.html v Edge 156: po novém postavení Každý platí 506 Kč | Celkem 2 024 Kč včetně spropitného 10 %. | tip buttons: 0 | change buttons enabled: 3; proto-ai-count.html: why Aplikace „Rezervační systém“ postavená | Úpravy zadané AI: 2 a opener ...postavil aplikaci „Rezervační systém“ a dostal od vás 2 úpravy, přitom obě úpravy padly na Dělení útraty; prototyp 1023, 1031, 1122-1135, 1162.

**Návrh:** Při každém buildIdea vytvořit nový stav aplikace. Ondřej rozhodne, jestli se úpravy pro hodnocení počítají za poslední aplikaci, nebo celkem, a podle toho se upraví opener() a why().

### A16: Referenční testy přes page.evaluate shadow DOM nevidí

*test, potvrzeno*

Lokátory Playwrightu podle CSS projdou otevřeným shadow root, kód v page.evaluate ale ne. Kontrola fokusu v okně vrátí False, protože document.activeElement je hostitel. hiddencheck projde naprázdno, protože document.querySelectorAll('[hidden]') do shadow root nevidí a nic neověří. Uzavřený shadow root by rozbil i lokátory.

**Doklad:** check7.py:34 document.activeElement.closest('#cel'); hiddencheck.py:8 document.querySelectorAll('[hidden]'); embed-mechanics.html: document.activeElement = hostC; průchod lokátorů shadow DOM podle dokumentace Playwright, neověřeno (Playwright tu není nainstalovaný).

**Návrh:** Shadow root otevřít (mode open). V testech číst host.shadowRoot.activeElement a procházet shadowRoot.querySelectorAll('[hidden]'), navigaci řešit klikáním a přes data-start podle README.

### R1: Kontroly přes document v page.evaluate po přenosu do Shadow DOM tiše projdou

*test, potvrzeno*

hiddencheck.py hledá skryté prvky přes document.querySelectorAll, který do shadow root nevidí. Vrátí prázdný seznam, i když widgetu chybí pravidlo [hidden]{display:none !important} (prototyp řádek 434) a skryté prvky jsou vidět. Navíc kontroluje jen výchozí stav každé obrazovky.

check7.py:34 testuje past na fokus výrazem document.activeElement.closest('#cel'). Ve stínu je document.activeElement hostitel, takže výraz vrací vždy False. Oprava pouhou záměnou za shadowRoot.activeElement ale projde i s rozbitou pastí. Kód prototypu (řádky 857 až 860) hledá document.activeElement v seznamu tlačítek, ve stínu dostane -1 a fokus po každém Tabu skočí na první tlačítko; kontrola „fokus je uvnitř okna“ to nepozná.

Stejně nemůžou selhat kontroly na ID, která v prototypu nikdy nebyla:
- #a-own (check7.py:57, pole pro vlastní pokyn);
- #gate, #r-form, #f-name, #gf-name (check7.py:22, žádný kontaktní formulář).
Nový formulář nebo pole s jiným ID těmito kontrolami projde.

**Doklad:** probe_shadow.out.txt (Edge 156, otevřený shadow root, #leak má atribut hidden a display:block):
- „1 hiddencheck expression on page with hidden-but-visible #leak in open shadow root: []“;
- „2 locator('x-w#open #leak').is_visible(): True“;
- past z prototypu přenesená 1:1, po každém ze 6 Tabů „['X-W', False, 'c1', True]“ (document.activeElement, výraz z check7, shadowRoot.activeElement.id, uvnitř #cel).
Výskyty v prototypu: 'gate': 0, 'gf-': 0, 'a-own': 0, 'r-form': 0, 'f-name': 0.

**Návrh:** Kontroly psát přes Playwright lokátory, které do otevřeného shadow root pronikají, nebo v evaluate přes host.shadowRoot.
- hiddencheck: projít shadowRoot.querySelectorAll('[hidden]'), spouštět ho i ve stavech po vyřešení úloh a ve výsledku a ověřit, že našel nenulový počet prvků.
- Past na fokus: testovat pořadí. Z „Můj výsledek“ vede Tab na „Zůstat tady“, „Další práce“ a zpět (tak se chová prototyp), Shift+Tab opačně.
- Kontaktní formulář a vlastní pokyn: kontrolovat obecně. Ve widgetu není form ani input typu email nebo tel a v ukázce Stavění s AI není textové pole mimo #a-app.

### R2: Kapitola 7 tvrdí, že referenční testy pokrývají chování, ale řadu kritérií nepokrývají

*rozpor, castecne*

Věta ZADANI.md:188 „testy z referencni-testy/ to pokrývají“ neplatí pro celý blok Chování. Šířky 320 až 430 px testy nepokrývají, check6 měří jen 390 a 1366 px a jen v Kyberbezpečnosti. Čtyři karty na 390 × 844 a ostrost plátna při vyšším DPR netestuje nic. Editor ovládaný klávesnicí a návrat fokusu po zavření okna prototyp neumí, takže je testy pokrývat ani nemůžou. Celé kritérium pro test-host.html je nové. Kritéria vzhledu, textů a dat (ř. 184-186, 199-200) zadání za pokrytá nevydává, nové testy ale potřebují. Skripty běží jen v Chromiu. Do plánu patří nové testy a opravená formulace věty na ř. 188.

**Doklad:** - ZADANI.md:188 „Chování (všechno už v prototypu funguje, testy z `referencni-testy/` to pokrývají)“; ZADANI.md:184-200.
- check6.py:14, check7.py:16, gametest.py:14, hiddencheck.py:5: pw.chromium.launch().
- probe_proto.out.txt „A 390x844 path-card bottoms [617, 617, 807, 807]“: kritérium platí, test chybí.
- probe_proto2.out.txt „1 320px scrollWidth with Prototyp tag 330, without it 320“: na 320 px prototyp přetéká jen kvůli štítku, který se nepřebírá.

**Návrh:** V plánu počítat s novými testy, ne jen s přepisem čtyř skriptů:
- přetečení pro 320, 360, 375, 390, 414 a 430 px ve všech obrazovkách;
- čtyři karty na mobilu;
- plátno s deviceScaleFactor 2 (canvas.width = 2 × CSS šířka, poměr 12 : 7);
- návrat fokusu na „Zkusit další práci“;
- klávesnicový editor;
- sada pro test-host.html;
- vizuální snímky;
- kontrast a velikost cílů (axe-core jako vývojová, ne runtime závislost);
- reduced motion (konfety se nezobrazí);
- unit testy hodnocení, opener() a schématu, DRY_RUN scénáře a dataLayer.
S Ondřejem potvrdit prohlížeče; návrh je Chromium a WebKit pro embed a hlavní toky. Navrhnout mu opravu věty v ZADANI.md:188.

### R3: Automatické posouvání v úlohách schová pruh s odznakem pod lepicí hlavičku webu

*mezera, potvrzeno*

Zadání řeší odstup data-scroll-offset jen pro přepnutí obrazovky (ZADANI.md:39) a test-host test jen pro něj (ZADANI.md:196). Prototyp ale posouvá i uvnitř úloh: reveal() volá scrollIntoView s block:'start' (řádek 818), a to po dokončení úlohy (881), při stavění a úpravě aplikace (1128, 1147, 1173) a po odemčení editoru hry (1338). Podmínka v reveal() i IntersectionObserver plovoucího tlačítka (990) navíc počítají s celým oknem.

Na prototypu se simulovanou lepicí hlavičkou 176 px a obsahem webu pod widgetem skončil pruh „Vyzvednout odznak“ i náhled aplikace na y = 0, tedy celý pod hlavičkou, na 390 × 844 i na 1366 × 768. Referenční testy běží bez lepicí hlavičky, takže to nezachytí.

**Doklad:** probe_proto2.out.txt:
- „2 390x844 data solved, 176px sticky header + host content below: {'claimTop': 0, 'claimBottom': 144, 'hitAtClaimTop': 'fakehdr'}“;
- „2 1366x768 data solved ...: {'claimTop': -0.0, 'claimBottom': 86, 'hitAtClaimTop': 'fakehdr'}“;
- „2 390x844 ai app built: {'previewTop': -0.0, 'hitAtPreviewTop': 'fakehdr'}“.
Simulace: header.site skrytý, na začátku body lepicí div 176 px se z-index 1030, za main blok 1500 px. Prototyp řádek 818: „el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block:'start' })“.

**Návrh:** Zavést jednu posouvací funkci widgetu, která odečte data-scroll-offset (nebo nastaví scroll-margin-top na prvcích ve stínu) a kterou používá přepnutí obrazovky, reveal() i plovoucí tlačítko. IntersectionObserver dostane rootMargin minus odstup. Na test-host.html přidat test: po dokončení každé úlohy je pruh s odznakem celý pod hlavičkou a elementFromPoint v jeho horní části vrací prvek widgetu. Totéž pro náhled aplikace a nástroje editoru.

### R4: Datová analýza: tři chyby a vyřešení na třetí pokus mají stejný stav i text

*chyba-v-prototypu, potvrzeno*

Po třetí špatné odpovědi nástroj ukáže správnou a úlohu uzavře (řádky 965-969). Počítadlo tries je pak 3 stejně jako při vyřešení na třetí pokus, firstTry je false a stav nemá příznak, že odpověď ukázal nástroj. Výsledek proto v obou případech píše „Detektivka vyřešená na 3. pokus“ a opener je stejný.

Pravidla hodnocení v kapitole 4 přitom rozlišují average (vyřešeno na 2. nebo 3. pokus) a bad (odpověď ukázal nástroj po třech chybách) a příklad payloadu nese jen tries. Unit test pravidel hodnocení nad stavem z prototypu napsat nejde a port 1:1 zapíše do pole Data Analyst average místo bad.

**Doklad:** probe_proto.out.txt:
- „F wrong,wrong,wrong: why = Detektivka vyřešená na 3. pokus | ...“;
- „F wrong,wrong,correct: why = Detektivka vyřešená na 3. pokus | ...“;
- opener v obou případech „Vidím, že máte za sebou datovou detektivku. Co vás na práci s daty bavilo?“.
Prototyp řádky 953 (S.data.tries++), 960 (firstTry), 965-969, 1648; ZADANI.md:95 a :135.

**Návrh:** Do stavu i payloadu přidat příznak (třeba solved: false nebo revealed: true) a hodnotit podle něj. Text výsledku pro odhalenou odpověď je změna textu, takže ho musí schválit Ondřej. Unit testy pokrýt pro čtyři případy: 1., 2. a 3. pokus a tři chyby.

### R6: Většina řádků jen tiskne hodnotu bez očekávání a norm() maže pevné mezery

*test, potvrzeno*

Skripty skončí s kódem 0, pokud nespadnou, a výstup musí číst člověk. Očekávanou hodnotu nemají:
- šířka stránky v Kyberbezpečnosti (check6.py:25, nesrovnává se s šířkou okna);
- plátno a spodek tlačítka Hrát (check6.py:28);
- políčko trackeru (check6.py:40);
- všechny texty a ceny (check7.py:27, 39, 40, 62, 64, 66, 76, 78, 81, 84, 87);
- stavy hry (gametest.py:21, 28, 37);
- hiddencheck (hiddencheck.py:9 jen vypíše seznam).

norm() v check7.py:4 nahrazuje U+00A0 a U+202F obyčejnou mezerou, takže kritérium „texty 1:1 včetně pevných mezer“ tudy ověřit nejde. Prototyp přitom sám používá obyčejnou mezeru jako oddělovač tisíců na řádcích 465 („35 000“), 502 a 543 („57 600“) a 689 („2 500“). Na mobil-vysledek.png se „2 500“ láme na dva řádky. inner_text navíc vrací text po text-transform („DOTACE 35 000 KČ“).

**Doklad:** - check7.out.txt: „A price: Kolik zaplatíš | 29 000 Kč | DOTACE 35 000 KČ |  | Běžná cena kurzu 64 000 Kč. Z toho 35 000 Kč zaplatí úřad práce.“, bez porovnání.
- Znaky ve třídě norm(): ['0xa0', '0x202f'].
- Sken prototypu, řádek 689: mezi „2“ a „500“ je U+0020, za „500“ U+00A0.
- Všechny čtyři skripty exit=0.

**Návrh:** Převést výpisy na expect s hodnotami, které dnes dává prototyp:
- šířka stránky nejvýš šířka okna;
- spodek Hrát nejvýš 768 na 1366 × 768;
- poměr plátna 12 : 7;
- ceny „29 000 Kč“ a „Dotace 35 000 Kč“, „5 795 Kč“ a „Dotace 19 105 Kč“, s nízkopříjmovou skupinou „0 Kč“, „Dotace 24 900 Kč“ a „Celou cenu může zaplatit úřad práce.“
Texty porovnávat přes textContent bez normalizace. Přidat zvláštní test, který ve všech obrazovkách hledá obyčejnou mezeru mezi číslicemi a před jednotkou, mezeru za jednopísmennými slovy a znak U+2014. Hodnotu pro políčko trackeru rozhodnout v samostatném nálezu.

### R7: Tlačítko Hrát na 1366 × 768: na samostatné stránce vidět je, ve vložení pod hlavičkou 176 px ne

*otazka, potvrzeno*

check6 měří spodek tlačítka Hrát 694 px při výšce okna 768, a to na samostatné stránce s vlastní hlavičkou 56 px. Když místo ní dám lepicí hlavičku 176 px jako na test-host.html, spodek je 814 px, a to ještě bez světlého pruhu s odznaky, který má embed nahoře (ZADANI.md:36).

Výšku plátna prototyp počítá z window.innerHeight × 0,48 (řádek 1268) a o hlavičce webu neví. Kapitola 7 neříká, jestli kritérium platí i pro embed. Na 390 × 844 vychází 699 px, tam se tlačítko vejde. Odhad: s plátnem počítaným z výšky pod hlavičkou by spodek byl asi 730 px plus výška pruhu odznaků (neověřeno).

**Doklad:** probe_proto.out.txt:
- „C 1366x768 standalone {'playBottom': 694, 'mainTop': 56, 'canvasH': 369}; with 176px sticky header instead of own header: play bottom 814 (viewport 768)“;
- „C 390x844 ... play bottom 699 (viewport 844)“.
ZADANI.md:193; prototyp řádek 1268 „const tile = Math.min(w / COLS, (window.innerHeight * 0.48) / ROWS);“.

**Návrh:** Zeptat se Ondřeje, jestli kritérium platí i pro embed. Výchozí návrh: platí pro obě varianty. V embed se výška plátna počítá z prostoru pod hlavičkou (innerHeight minus data-scroll-offset minus pruh odznaků) a test běží na index.html i na test-host.html.

### R8: Referenční screenshoty obsahují části, které se nepřebírají, a mají různé DPR a rozměry

*rozpor, potvrzeno*

Všechny snímky mají tmavou hlavičku se štítkem „PROTOTYP“. Výsledky (notebook-vysledek.png, mobil-vysledek.png) mají navíc panel „Pohled obchodníka“ a poznámku v patičce. To se podle ZADANI.md:17-20 nepřebírá, takže pixelové srovnání s těmito PNG musí selhat.

Rozměry se liší:
- mobilní snímky mají 780 × 1688, tedy 390 × 844 při DPR 2; mobil-vysledek je celá stránka 780 × 4464;
- notebookové jsou při DPR 1 a tři z nich celostránkové (ai 1366 × 1328, data-hotovo 1366 × 1010, vysledek 1366 × 1037).
Snímky embed varianty chybí úplně a referenční testy žádné snímky nedělají.

**Doklad:** - Hlavičky PNG: „mobil-uvod.png 780x1688“, „mobil-vysledek.png 780x4464“, „notebook-ai.png 1366x1328“, „notebook-vysledek.png 1366x1037“.
- notebook-vysledek.png ukazuje „PROTOTYP“ a „Pohled obchodníka: co dorazí do Pipedrivu“.
- ZADANI.md:184 „Shoda se screenshoty na 390 × 844 a 1366 × 768, ověřená Playwright snímky.“

**Návrh:** Dodané PNG brát jako vizuální vzor, ne jako baseline. Baseline pro toHaveScreenshot vygenerovat z hotové samostatné stránky až po Ondřejově vizuálním schválení:
- deviceScaleFactor 2 pro mobil a 1 pro notebook;
- fullPage tam, kde ho má vzor;
- maska pro konfety a čas;
- písma dodaná lokálně v testovacím prostředí.
Domluvit toleranci a jestli se dělají i snímky embed na test-host.html.

### R9: Políčko trackeru návyků má 32 px, kritérium chce dotykové cíle aspoň 44 px

*rozpor, potvrzeno*

check6 měří velikost políčka v ukázkové aplikaci Tracker návyků, ale očekávanou hodnotu nemá; prototyp dává 32 px. ZADANI.md:186 chce cíle aspoň 44 px, ZADANI.md:13 zároveň vzhled 1:1 s prototypem.

Pod 44 px je na 390 × 844 víc prvků:
- odkaz „Zpět na výběr“: 33 px;
- „Přidat“ v trackeru: 34 px;
- pole „Nový návyk“: 38 px;
- odznaky v hlavičce: 40 px;
- štítek „Zajímá mě školení přes firmu“: 24 px na výšku;
- souhrn „Jak příspěvek funguje a jak o něj požádat“: 17 px.

**Doklad:** check6.out.txt: „habit cell size 32px“.
probe_proto.out.txt:
- „H ai ...: 'button.linkish': {'h': 33 ...}, 'button.hcell': {'h': 32, 'w': 32 ...}, 'input#ap-new': {'h': 38 ...}, 'button#ap-add': {'h': 34 ...}“;
- „H vysledek: {'a.prog': {'h': 40 ...}, 'label.lowinc': {'h': 24 ...}, 'summary.': {'h': 17 ...}}“.

**Návrh:** Rozhodnout s Ondřejem, co má přednost. Výchozí návrh: 44 px pro ovládání nástroje (Zpět, souhrny, štítky zaškrtávátek přes padding, odznaky) a ukázkové aplikace uvnitř úlohy nechat 1:1 jako výslovnou výjimku. Test pak kontroluje 44 px se seznamem výjimek.

### S1: Žádný z 11 snímků nejde porovnat 1:1, obsahují části, které widget mít nesmí

*rozpor, potvrzeno*

Kapitola 7 chce shodu se snímky ověřenou Playwright snímky. Kapitola 2 ale vyřazuje štítek „Prototyp“, poznámku v patičce, panel „Pohled obchodníka“ a v embedu celou tmavou hlavičku. Štítek „Prototyp“ je na 10 z 11 snímků. Chybí jen na mobil-odznak, kde je hlavička odscrollovaná. Poznámka v patičce je na 7 snímcích (mobil-hra, mobil-odznak, mobil-vysledek, notebook-ai, notebook-data-hotovo, notebook-kyber, notebook-vysledek), panel obchodníka na 2 (mobil-vysledek, notebook-vysledek). Čtyři snímky jsou celostránkové a bez vyřazených částí bude stránka nižší: notebook-ai z 1328 na 1267 px, notebook-data-hotovo z 1010 na 950, notebook-vysledek z 1037 na 871 a mobil-vysledek z 2232 na 1969 CSS px. Porovnání tak selže už na rozměru. V embedu navíc chybí hlavička (52 px na mobilu, 56 px na notebooku), takže se na všech snímcích posune celý obsah.

**Doklad:** ZADANI.md:17-20 „Z prototypu se nepřebírá: panel „Pohled obchodníka“ … štítek „Prototyp“ a poznámka v patičce“; ZADANI.md:184 „Shoda se screenshoty na 390 × 844 a 1366 × 768, ověřená Playwright snímky.“; prototyp:448 `<span class="proto-tag">Prototyp</span>`, :699 `<details class="sales">`, :720 `<footer class="container foot-note">`; C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/shots.json pageHeight_proto_vs_withoutProtoParts: [1328, 1267], [1010, 950], [1037, 871], [2232, 1969]

**Návrh:** S Ondřejem rozhodnout, jak shodu ověřovat. Varianta (a): snímky z prototypu brát jen jako vizuální předlohu, Ondřej schválí vzhled nové verze a z ní se teprve vygenerují baseline pro Playwright. Varianta (b): porovnávat jen výřezy s maskou na hlavičku, patičku a panel obchodníka a s oříznutím na společnou výšku. Pro embed dodat vlastní referenci.

### S2: Pixelová shoda závisí na platformě, písmech a přesném stavu

*riziko, potvrzeno*

Současný prototyp jsem ve stejných stavech vykreslil v Edge 156 na Windows. U všech 11 snímků vyjdou stejné rozměry, ale 0,19 až 2,72 % pixelů se v některém kanálu liší o víc než 48 z 255, vždy na hranách písma. Vyhlazování a hinting jsou jiné, reference tedy nejspíš vznikly na jiném systému (neověřeno). Bez tolerance by proto nemusel projít ani prototyp sám (neověřeno přímo v toHaveScreenshot). Shodu dál ovlivňuje: mobilní snímky jsou v DPR 2, písma se tahají z Google Fonts přes síť, tečka v Kyberbezpečnosti bliká, notebook-kyber zachycuje hover na druhé možnosti a mobil-odznak je zachycený v posunu stránky po plynulém scrollu.

**Doklad:** C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/shots.json: notebook-uvod pctBig 1.788, notebook-data-hotovo 2.33, notebook-vysledek 2.719, mobil-vysledek 2.139, mobil-odznak 0.19; C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/notebook-uvod-diff.png (červeně jen obrysy písmen); prototyp:6 odkaz na fonts.googleapis.com; prototyp:320 `.dot{... animation:blink 1.2s infinite}`; notebook-kyber.png: žlutý rámeček u „198.51.100.23 (3 pokusy)“ odpovídá .opt:hover (prototyp:183)

**Návrh:** Baseline vytvářet i porovnávat na jedné platformě (například Playwright Docker image v CI). Mobil spouštět s deviceScaleFactor 2, písma pro testy mít uložená lokálně, nastavit animations: 'disabled' a myš dát mimo stránku. Toleranci dohodnout s Ondřejem (například maxDiffPixelRatio 0,01 až 0,03). Hover v notebook-kyber a scroll v mobil-odznak buď přesně napodobit, nebo snímky přegenerovat v klidovém stavu.

### S3: Embed nemá vizuální předlohu, světlý pruh s odznaky v prototypu není

*mezera, castecne*

Embed nemá v prototypu ani na snímcích předlohu (ZADANI.md:36 je jediná věta). Kdyby se ukazatel odznaků přenesl z tmavé hlavičky beze změny, měl by žlutý text na bílé kontrast 1,73:1 a na krémové 1,57:1. Ikony s bílým tahem by nebyly vidět a odkaz href="#vysledek" by měnil hash hostitelské stránky. Chybí výška a barvy pruhu, chování po kliknutí, jestli je lepicí a podoba na 320 px. Kritérium „čtyři karty bez scrollování“ se embedu netýká, protože ZADANI ho omezuje na samostatnou stránku.

**Doklad:** grep -i "embed|variant" v prototypu: 0 výskytů; ZADANI.md:36 „embed (bez vlastní hlavičky, ukazatel odznaků jako světlý pruh nahoře ve widgetu)“; prototyp:60 `.prog{... min-height:40px; ... color:var(--yellow)`, :64 `.mini svg{... stroke:rgba(255,255,255,.7)`, :449 `<a class="prog" href="#vysledek"`; kontrast #FABA20 proti #FFFFFF 1,73:1 (stejná dvojice barev jako písmeno L v logu v C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/a11y.json)

**Návrh:** Požádat Ondřeje o návrh nebo schválení pruhu. Rozumný výchozí návrh: krémový pruh, tmavý text, ikony s tmavým tahem a tlačítko „Odznaky 0/4“ vysoké 44 px, které otevře výsledek. Pak doplnit referenční snímky embedu z test-host.html na 390 a 1366 px.

### S5: Ubuntu Mono v embedu chybí, coderslab.cz ho nenačítá

*rozpor, potvrzeno*

Podle ZADANI se v embedu písma nenačítají, protože web už má Ubuntu a Open Sans. Terminály v ukázkách Stavění s AI a Kyberbezpečnost, výpis SQL a kódy příkazů ale používají Ubuntu Mono a to coderslab.cz nenačítá. V embedu by se tyto texty zobrazily v Consolas nebo Menlo a neodpovídaly by snímkům notebook-ai a notebook-kyber ani CLAUDE.md. CLAUDE.md navíc chce Ubuntu Mono i ve hře, prototyp ale ve hře kreslí písmem Ubuntu.

**Doklad:** C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/coderslab-styles.css (curl https://coderslab.cz/assets/css/styles.css): jediný import písem `family=Open+Sans:wght@400;500;600;700&family=Ubuntu:wght@400;500;700`, „Ubuntu Mono“ 0 výskytů ve styles.css i v HTML úvodní stránky; prototyp:29 `--mono:'Ubuntu Mono', ui-monospace, ...`, použití :192 .code, :241 .term, :315 .cmd code; prototyp:1254 `ctx.font = '700 0.42px "Ubuntu", Arial, sans-serif'`; ZADANI.md:50; CLAUDE.md „ve hře a terminálu Ubuntu Mono“

**Návrh:** Rozhodnout jednu z variant. Buď v embedu vložit do hostitelské stránky odkaz jen na Ubuntu Mono, protože font-face uvnitř Shadow DOM v Chrome nefunguje. Nebo přijmout systémové monospace písmo. Větu o hře v CLAUDE.md sladit s prototypem.

### S6: Dotykové cíle menší než 44 px

*chyba-v-prototypu, potvrzeno*

Změřeno v Edge na 390 × 844 i 1366 × 768. Menší než 44 px je těchto 13 druhů prvků:
- „Odznaky 0/4“ v hlavičce (a.prog): 40 px na výšku.
- „Zpět na výběr“ (button.linkish.back) ve všech čtyřech ukázkách: 115,8 × 33 px.
- „Zůstat tady“ (#cel-close): 79,5 × 33 px.
- „Stačí, chci výsledek“ (#g-skip): 133,2 × 33 px.
- Rozbalovací „Jak na to přijde datový analytik“ (#d-sql-box summary): 17 px na výšku.
- Rozbalovací „Jak příspěvek funguje a jak o něj požádat“ (#r-price-box summary): 17 px na výšku.
- Zaškrtávátko „Zajímá mě školení přes firmu“ (#r-firm i se štítkem): 24 px.
- Zaškrtávátko nízkopříjmové skupiny (#r-lowinc): 24 px na šířce 820 px, kde je štítek na jednom řádku.
- Odkaz „Víc o školení pro firmy“: 144 × 19 px.
- Odkaz „Domluv si nezávaznou konzultaci“ uvnitř věty: 19 px.
- Tlačítka .app-btn v ukázkových aplikacích AI (spropitné, dny, služby, časy, Rezervovat, Přidat): 34 px.
- Políčka trackeru návyků .hcell: 31,7 × 31,7 px.
- Pole #ap-new: 38 px.
Když se tyto prvky převezmou 1:1, nesplní kritérium z kapitoly 7.

**Doklad:** targets v C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/a11y.json; výstupy skriptů C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/a11y3.py (#cel-close [79.5, 33], #g-skip [133.2, 33]) a C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/lowinc.py („820 lowinc label height 24“); CSS prototyp:60 `.prog{... min-height:40px`, :82 `.linkish{... padding:8px 0; font:500 15px`, :194 `details.more summary{cursor:pointer; font:500 15px`, :263 `.app-btn{font:500 14px var(--head); padding:8px 13px`, :270 `.hcell{aspect-ratio:1`; ZADANI.md:186 „dotykové cíle aspoň 44 px“

**Návrh:** Zvětšit klikací plochu bez změny vzhledu, například min-height 44 px, průhledným paddingem nebo pseudo-elementem, který přesahuje prvek. S Ondřejem potvrdit dvě věci. Za prvé, jestli platí výjimka WCAG pro odkazy uvnitř věty. Za druhé, jestli se pravidlo týká i ukázkových aplikací v AI, kde by větší tlačítka změnila jejich vzhled.

### S7: Fokus na tmavých plochách skoro není vidět

*chyba-v-prototypu, potvrzeno*

Výchozí fokus je 3px obrys v tmavě modré #17496F. Na tmavém pozadí #212529 má kontrast jen 1,63:1. Týká se to výpisu kódu v AI (#a-code) a výstupu terminálu v Kyberbezpečnosti (#s-out). Do obou se scrolluje, a proto je Edge 156 sám zařazuje do pořadí Tab. Stejně slabý fokus mají všechny ovládací prvky ukázkové aplikace po úpravě „Přepni na tmavý vzhled“ (v Rezervačním systému 9 zastávek). Hlavička a doporučení mají žlutý obrys, terminál a tmavá aplikace ne.

**Doklad:** C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/a11y.json: `{'sel': '#a-code', 'outline': '3px solid #17496F', 'outlineBg': '#212529', 'outlineContrast': 1.63, 'tabIndexAttr': None}`, stejné hodnoty pro #s-out; aiDarkFocus v C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/a11y2.json: dny, časy a Rezervovat také 1.63; prototyp:46 `:focus-visible{outline:3px solid var(--navy)`, :59 `.site :focus-visible{outline-color:var(--yellow)}`, :363 `.reco :focus-visible{outline-color:var(--yellow)}`, :250 `.codeview{white-space:pre; overflow:auto; max-height:230px`, :303 `.sec-out{... overflow:auto`

**Návrh:** Pro .term, .code a .device.dark nastavit žlutý obrys, stejně jako pro .site a .reco. Scrollovacím výpisům dát tabindex="0" a popisek, aby se daly posouvat klávesnicí i v prohlížečích, které je samy nefokusují.

### E1: Web nenačítá Ubuntu Mono, které pravidla vyžadují ve hře a terminálu

*rozpor, potvrzeno*

CLAUDE.md požaduje ve hře a terminálu Ubuntu Mono a prototyp ho načítá z Google Fonts. ZADANI říká, že v režimu embed se písma nenačítají, protože je web už má. Web ale načítá jen Ubuntu a Open Sans, Ubuntu Mono vůbec. Ověřil jsem i tvrzení ZADANI o Shadow DOM: v Edge se @font-face, které je jen uvnitř shadow root (přes @import z Google Fonts), nepoužije. V režimu embed by tedy terminál a ukázky kódu přešly na záložní písmo. Na Windows je Consolas o 10 % širší a Courier New o 20 %. Mobilní monospace mívají kolem 0,6 em, takže by byly také asi o 20 % širší (neověřeno na zařízení). Vodorovné přetečení stránky to nezpůsobí, protože bloky mají overflow-x:auto, pre-wrap nebo ellipsis. Vzhled se ale nebude shodovat se screenshoty. Vložit @font-face do hlavičky dokumentu by zase porušilo pravidlo nesahat na stav hostitelské stránky.

**Doklad:** CLAUDE.md:14 „ve hře a terminálu Ubuntu Mono“; CLAUDE.md:23 „Nesahat na location.hash ani na jiný stav hostitelské stránky.“; ZADANI.md:50 „v režimu embed se písma nenačítají znovu“; prototyp/prace-na-zkousku.html:6 „family=Ubuntu+Mono:wght@400;700“. Na /cz/ document.fonts obsahuje jen Open Sans a Ubuntu. Příkaz "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --window-size=1366,768 --virtual-time-budget=15000 --dump-dom pro soubor C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/externi-fakta/font-doc.html vypsal šířky 44 znaků při 14 px: 'Ubuntu Mono' 308, Consolas 338.68, 'Courier New' 369.66. Pro soubor C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/externi-fakta/font-shadow.html vypsal shadowSpanWidth_UbuntuMonoDeclaredOnlyInShadow 369.67 a courierNewWidth 369.67.

**Návrh:** Ať rozhodne Ondřej. Možnosti: (a) web přidá Ubuntu Mono do svého styles.css, (b) widget v režimu embed jednou vloží do document.head jediné @font-face pro Ubuntu Mono jako výslovnou výjimku z pravidla, nebo (c) v režimu embed přijmout záložní písmo a screenshoty embedu porovnávat s tolerancí. Doporučuji (a), případně (b).

### E2: Pevný odstup 176 px pro lepicí hlavičku platí jen na části webu

*rozpor, potvrzeno*

ZADANI počítá s výchozím odstupem 176 px (60 + 59 + 56). Na živém webu se výška lepicích prvků liší podle stránky i šířky okna. Od 1200 px má růžový pruh 60 px, tmavé menu 58,1 až 58,8 px a podmenu se lepí od 119 px. Na úvodní stránce a u Game Developer má podmenu 56 px (spodní hrana 175 px), u Data Analyst, Agentic coding a IT Administrator 80 px (spodní hrana 199 px). Mezi 992 a 1199 px se lepí jen růžový pruh (60 px) a podmenu je skryté. Pod 992 px není nahoře lepicí nic (0 px) a menu je fixní lišta 70 px dole. S pevnými 176 px by na stránkách kurzů, tedy právě tam, kde se má používat data-start, zůstalo 23 px widgetu pod podmenu. Na mobilu by nad widgetem po posunu zbylo 176 px cizího obsahu. test-host.html podle ZADANI (pevná hlavička 176 px) ani jeden z těchto případů nezachytí.

**Doklad:** ZADANI.md:39 „výchozí 176 (na coderslab.cz je to růžový pruh 60 px, tmavé menu 59 px a světlé podmenu 56 px)“; ZADANI.md:56 „lepicí hlavička 176 px“. javascript_tool při 1366×768 po scrollTo(2500): /cz/ „._submenu … top=119 h=56“, /cz/kurzy/data-analyst „._submenu sticky … top=119 h=80“, agentic-coding h=80, it-administrator h=80, game-developer h=56, .site-header h=58.14 až 58.81. Při 1100×768: „.sticky-lg-top: pos=sticky … h=60“, „._submenu: pos=static disp=none“, „.site-header … h=0“. Při 390×844: „.sticky-lg-top: pos=static“, elementFromPoint(195, 5 až 130) vrací obsah stránky, „nav.mobile-nav: pos=fixed … top=774 … h=70“.

**Návrh:** Odstup měřit za běhu v okamžiku posunu: vzít spodní hranu prvků s position sticky nebo fixed, které jsou právě přilepené u horního okraje (na webu .sticky-lg-top, .site-header, ._submenu). data-scroll-offset nechat jen jako ruční přepsání. test-host.html postavit se stejnými breakpointy: pruh lepicí od 992 px, menu a podmenu od 1200 px, podmenu ve variantách 56 i 80 px, dolní lišta 70 px pod 1200 px. Posun testovat na 390, 1100 a 1366 px.

### E3: Stránka /cz/talentovy-test je holý Typeform bez hlavičky, GTM i písem webu

*rozpor, castecne*

Stránka /cz/talentovy-test má ve zdroji jen 422 bajtů: Typeform přes celou obrazovku (data-tf-widget="xI7D1Y2d") bez šablony webu, GTM a písem. Pokud nástroj tuto adresu nahradí (otázka 9.2), musí se stránka postavit znovu v šabloně webu s GTM. Variantu embed nejde jen vložit do současné stránky. Návštěvníci z položky menu přijdou bez tokenu ?pnz, takže se do Pipedrivu nezapíše nic a nástroj od nich ani nezíská kontakt. Ondřej by měl potvrdit, jestli to tak má být.

**Doklad:** ZADANI.md:215 „nahradí /cz/talentovy-test (vedou tam tlačítko v menu a pozvánka na webu)“; ZADANI.md:9 „v odkazu má token“; ZADANI.md:67 „Bez tokenu se do Pipedrivu nic nezapisuje“. javascript_tool na https://coderslab.cz/cz/talentovy-test: status 200, délka HTML 1193, jediný skript https://embed.typeform.com/next/embed.js, atribut data-tf-widget=xI7D1Y2d, style „z-index: 10001; position: absolute“, žádné prvky fixed ani sticky. Text .site-header na /cz/ obsahuje „Talentový test“.

**Návrh:** Otázku 9.2 doplnit takto: pokud nástroj nahradí tuto adresu, buď tam dát variantu standalone (vlastní písma a hlavička) a doplnit GTM, nebo stránku převést do šablony webu. Zároveň rozhodnout, co s návštěvníky z menu bez tokenu: buď přijmout, že se do Pipedrivu nezapisují, nebo je nejdřív poslat přes formulář, který token vytvoří.

### E4: API v1 pro dealy, aktivity a vyhledávání je od 1. 8. 2026 mimo podporu

*riziko, potvrzeno*

ZADANI verzi API neurčuje. Pipedrive v dubnu 2025 označil za zastaralé endpointy v1 pro dealy (včetně /v1/deals/search a POST a PUT /v1/deals), aktivity, itemSearch a osoby. Jejich dostupnost slíbil do 31. 12. 2025 a od 1. 8. 2026 jsou mimo podporu: mohou dál fungovat, ale bez záruky, a mohou se změnit nebo zmizet bez upozornění. Většina návodů a starších klientů přitom v1 používá. Poznámky existují jen ve v1 a mezi zastaralými nejsou. Typy aktivit jsou také jen ve v1. Pole dealů už mají v2. Ve v2 vypadají data jinak: vlastní pole jsou v objektu custom_fields, enum je číselné id možnosti a místo PUT se používá PATCH.

**Doklad:** https://developers.pipedrive.com/changelog/post/deprecation-of-selected-api-v1-endpoints (oznámeno 14. 4. 2025, „Deprecated endpoints will remain accessible until December 31, 2025“; GET /v1/deals/search na GET /api/v2/deals/search, PUT /v1/deals/{id} na PATCH /api/v2/deals/{id}, POST /v1/activities na POST /api/v2/activities, GET /v1/itemSearch/field na GET /api/v2/itemSearch/field). https://developers.pipedrive.com/changelog/post/deprecated-apiv1-endpoints-become-out-of-support (oznámeno 29. 7. 2026, platí od 1. 8. 2026: „may remain functional“, „may be changed or removed without further notice“). https://developers.pipedrive.com/docs/api/v1/Notes uvádí jen /api/v1/notes.

**Návrh:** Zapsat do plánu: dealy, vyhledávání a aktivity přes v2 (GET /api/v2/deals/search nebo /api/v2/itemSearch/field, GET a PATCH /api/v2/deals/{id}, POST /api/v2/activities, POST /api/v2/dealFields), poznámky přes v1 (/api/v1/notes). Volat přímo přes fetch bez SDK, aby nepřibyla runtime závislost. Log v DRY_RUN psát ve tvaru požadavků v2.

### E7: Endpoint nemusí deal podle tokenu najít: lead místo dealu, viditelnost, velikost písmen

*otazka, castecne*

Endpoint musí najít deal podle PNZ tokenu. /api/v2/itemSearch/field s match=exact rozlišuje velikost písmen, /api/v2/deals/search s exact_match ne, takže token převádět na malá písmena. API vrací jen záznamy, které vidí vlastník API tokenu, proto je potřeba technický uživatel s viditelností všech dealů. K otázce 9.3 doplnit ověření, že formulář opravdu zakládá deal a ne lead, jak předpokládá ZADANI.md:63.

**Doklad:** ZADANI.md:63 „při vytvoření dealu vygeneruje náhodný token“; ZADANI.md:65 „Endpoint najde deal podle pole PNZ token“. https://developers.pipedrive.com/docs/api/v1/Leads: leady „do not have a separate set of custom fields“, GET /api/v2/leads/search podporuje fields=custom_fields. https://developers.pipedrive.com/docs/api/v1/ItemSearch: „The search is case sensitive“; Deals search: exact_match „not case sensitive“. getAccountContext: 'Visible to' | visible_to | opts=[(1, 'Item owner'), (3, 'All users')].

**Návrh:** K otázce 9.3 doplnit: zakládá formulář deal, nebo lead? Podle odpovědi hledat jen v dealech, nebo v leadech i dealech. API token vystavit pro administrátora nebo technického uživatele, který vidí všechny dealy. Token před uložením i před hledáním převést na malá písmena. Když deal není nalezen, vrátit 202 a nic nezapsat. Widget posílá vždy celý snímek, takže další odeslání to zkusí znovu.

### E8: Pipedrive nemá typ pole datum a čas pro PNZ poslední aktivita

*chyba-v-zadani, potvrzeno*

ZADANI chce pole PNZ poslední aktivita typu datum a čas. Vlastní pole dealu ale znají jen typy date (YYYY-MM-DD), time, daterange a timerange, kombinovaný typ neexistuje. Pole typu date jde filtrovat. Čas by musel být v druhém poli typu time (ve v2 objekt s value a timezone_name), nebo v textovém poli.

**Doklad:** ZADANI.md:129 „| PNZ poslední aktivita | datum a čas |“. https://developers.pipedrive.com/docs/api/v1/DealFields: field_type „varchar, varchar_auto, text, double, monetary, date, set, enum, user, org, people, phone, time, timerange, daterange, address“; https://pipedrive.readme.io/docs/core-api-concepts-custom-fields uvádí stejný seznam.

**Návrh:** Výchozí řešení: jedno pole typu date (PNZ poslední aktivita), přesný čas jen v poznámce. Pokud obchod potřebuje čas ve filtru, přidat druhé pole typu time s timezone_name Europe/Prague. Potvrdit s Ondřejem.

### E10: Zápis po každém odznaku spotřebovává API tokeny a resetuje hnití dealu

*riziko, castecne*

Každý zápis z nástroje (změna vlastního pole nebo poznámky) podle podpory Pipedrive vynuluje odpočet hnití dealu, takže aktivní deal ve fázi New nebo First Touch Made se přestane jevit jako zanedbaný. Ondřej by měl rozhodnout, jestli to obchodu vadí. Rozpočet API tokenů (30 000 × násobič × počet licencí, při 12 licencích nejméně 360 000 denně) běžný provoz s 35 až 70 tokeny na odeslání nevyčerpá. Endpoint ale přesto zapisuje jen změny a při 429 čeká podle x-ratelimit-reset.

**Doklad:** https://pipedrive.readme.io/docs/core-api-concepts-rate-limiting: „30,000 base tokens × subscription plan multiplier × number of seats“, pro vyhledávání „10 requests per 2 seconds“, 429 a 403 „HTML page produced by Cloudflare“. Ceny z referencí: deals/search 20, PATCH deal 5, PUT note 10, GET notes 20, POST activity 5. https://support.pipedrive.com/en/article/the-rotting-feature: „The rotting period is based on the deal‘s last updated time“, „Editing any details of the deal, such as custom fields“. getAccountContext: fáze New days_to_rotten 5, First Touch Made 3; pole 'Contacted via HelloSMS' a 'Aircall Tags'.

**Návrh:** Endpoint ať porovná snímek s hodnotami na dealu a zapisuje jen změny. Vazbu token na id dealu cachovat ve sdíleném úložišti. Při 429 počkat podle x-ratelimit-reset a hned neopakovat. Ondřejovi říct, že aktivita v nástroji resetuje hnití dealu, a nechat ho rozhodnout, jestli to obchodu vadí.

### E11: Aktivita Zavolat: termín počítat v pražském čase, svátky a typ nejsou určené

*mezera, potvrzeno*

Typ call (Call) v účtu existuje. Obchod ale používá i typy First Touch (first_touch_made) a Call Attempt, které odpovídají fázi First Touch Made, takže je otázka, který typ chce vidět. Pravidlo „po 17. hodině další pracovní den“ v prototypu není a bude jen na serveru. Serverless funkce běží v UTC (pro konkrétní hosting neověřeno) a due_time bere Pipedrive v UTC. Bez převodu na Europe/Prague se hranice 17. hodiny posune o hodinu až dvě. ZADANI také neříká, jestli pracovní den vynechává české svátky (například 28. 10. nebo 24. až 26. 12.).

**Doklad:** ZADANI.md:142 „termín dnes (po 17. hodině další pracovní den)“. getAccountContext, pole aktivity Type: ('call_attempt', 'Call Attempt'), ('first_touch_made', 'First Touch'), ('call', 'Call'). Grep „Zavolat|getHours|getDay\(“ v prototyp/prace-na-zkousku.html nic nenašel. https://devcommunity.pipedrive.com/t/activity-due-time-is-returned-in-utc/3090; https://developers.pipedrive.com/docs/api/v1/ActivityTypes („ActivityType.key_string = Activity.type“).

**Návrh:** Datum počítat přes Intl v pásmu Europe/Prague, posílat jen due_date bez due_time (úkol na celý den) a víkendy přeskakovat. Zeptat se, jestli použít typ call, nebo first_touch_made, a jestli přeskakovat české státní svátky (seznam svátků dát do konfigurace).

### E12: Překryvy widgetu narážejí na ikonu poradce (z-index 5000) a na mobilní lištu webu

*rozpor, potvrzeno*

ZADANI chce překryvy se z-index aspoň 2000 a tvrdí, že tím budou nad lištou cookies i okénkem poradce. Lišta cookies má přesně 2000. Při shodě rozhoduje pořadí v DOM: lišta je teď na začátku body, takže widget vyhraje, ale je to křehké. Okénko poradce (.toast-container, 1090) je pod 2000. Po jeho zavření ale web ukáže ikonu poradce #toastContactIcon s inline z-index 5000 v kořenovém kontextu (85×85 px vpravo dole). Cookie toastContactVisible=false ji pak drží i při dalších návštěvách. Ikona by zůstala nad oknem s odznakem i nad konfetami a dala by se proklikat mimo fokusovou past. Pod 1200 px má web fixní dolní navigaci 70 px. Plovoucí tlačítko „Znám viníka“ z prototypu (bottom 16 px, uprostřed) by leželo celé v ní a zakrylo by její prostřední položku. Mobilní menu webu přes celou obrazovku (#navbarScroll, z-index 5001) je uvnitř .site-header se z-index 1020, takže cokoli z widgetu nad 1020 bude i nad otevřeným menu. Lišta cookies je na 390×844 vysoká 395 px. Lepicí hlavička webu má z-index 1020, ne 1030. Iframe Sleeknote je při načtení skrytý, jeho z-index po zobrazení jsem neověřil.

**Doklad:** ZADANI.md:49 „z-index aspoň 2000, aby byly nad … lištou cookies i okénkem poradce vpravo dole“. prototyp/prace-na-zkousku.html:204 „.fab{position:fixed; left:50%; … bottom:calc(16px + …); z-index:20“. javascript_tool na /cz/: div#cookie-notice z=2000 (třetí potomek body), div.toast-container z=1090, #toastContactIcon s inline stylem „position:fixed; bottom:50px; right:50px; z-index:5000“ a řetězcem „div#toastContactIcon[fixed,z=5000] < div[static] < body[static]“; inline skript „toastWindowContact.addEventListener('hidden.bs.toast', () => { createCookie(…false); toastIconBootstrap.show(); })“; „div#navbarScroll.navbar-collapse[fixed,z=5001] < … < div.sticky-top.site-header[sticky,z=1020]“. Při 390×844: „nav.mobile-nav: pos=fixed … z=5000 rect=0,774,390,70“ uvnitř .site-header, „#cookie-notice … rect=0,448.66,390,395.34“.

**Návrh:** Okno s odznakem a konfety dát nad 5000 (například 2147483000). Plovoucí tlačítko v režimu embed zvednout nad dolní lištu webu (pod 1200 px například bottom 86 px, nebo měřit fixní prvky u dolního okraje) a nedávat ho výš než nutně. Do test-host.html přidat ikonu poradce se z-index 5000, lištu cookies se z-index 2000 a dolní lištu 70 px uvnitř lepicí hlavičky se z-index 1020.

### V1-1: Skloňování a předložky skládané v kódu nemají v cs.json formát

*mezera, doplněno*

ZADANI chce všechny texty v cs.json, aby je marketing měnil bez zásahu do kódu. Řada vět v prototypu ale vzniká v kódu podle čísla: tvar „úpravu, úpravy, úprav“ v openeru, „den, dny, dní“ v ukázce návyků, „z“ nebo „ze“ u mincí a „1 pokus, 3 pokusy, 412 pokusů“. ZADANI neříká, jak se tyto tvary v JSON zapíšou. Intl.PluralRules('cs') vrací kategorie one, few, other (a many jen pro desetinná čísla), takže skloňování podle čísla jde řešit standardně. Volbu z/ze tak vyřešit nejde.

**Doklad:** prace-na-zkousku.html:1744 'w = n === 1 ? 'úpravu' : (n >= 2 && n <= 4 ? 'úpravy' : 'úprav')'; :1083 'const daysWord = n => n === 1 ? 'den' : (n >= 2 && n <= 4 ? 'dny' : 'dní')'; :1375 z/ze podle seznamu; ZADANI.md:166 'Všechny texty do src/content/cs.json'. node: new Intl.PluralRules('cs') -> 1:one 2:few 4:few 5:other 1.5:many.

**Návrh:** V cs.json zapisovat počítané texty jako objekty {one, few, other} vybírané přes Intl.PluralRules('cs') a mezi číslo a slovo vkládat U+00A0. Pro mince zobrazit tvar bez předložky, nebo z/ze určovat funkcí podle výslovnosti; změnu textu schválí Ondřej. Na formátovač napsat unit test.

### V2-1: Při načtení stránky by widget posunul hostitelskou stránku

*mezera, doplněno*

Prototyp volá show() i při prvním vykreslení a show() pokaždé posouvá stránku. Zadání chce, aby se widget při přepnutí obrazovky posunul na svůj začátek pod hlavičku, ale nerozlišuje první vykreslení a přepnutí na pokyn uživatele. Kdo to přenese 1:1, dostane widget, který při načtení stránky kurzu (třeba s data-start=data uprostřed obsahu) skočí na widget a přeskočí horní část stránky webu.

**Doklad:** prototyp 1786 route(); → 781 show(h || 'start'); → 776 window.scrollTo(0, 0); ZADANI.md:39 „Při přepnutí obrazovky se widget posune na svůj začátek o tento odstup“.

**Návrh:** Posouvat jen při přepnutí obrazovky, které spustil uživatel, nikdy při prvním vykreslení, a to ani při ?ukazka nebo data-start. Do testů na test-host.html přidat kontrolu, že po načtení zůstane scrollY 0.

### V2-2: Texty a ceny v JSON jsou ve sestaveném JS, marketing je bez buildu nezmění

*otazka, doplněno*

Zadání chce texty a ceny v src/content/cs.json a config.json, „aby je marketing mohl měnit bez zásahu do kódu“. Zároveň chce jeden JS soubor z Vite v library mode. Import JSON se při buildu vloží do bundlu, takže každá změna ceny nebo textu znamená nový build a nasazení. Endpoint navíc potřebuje stejné názvy směrů a kurzů do poznámky v Pipedrivu, takže obsah musí být sdílený mezi widgetem a serverem. Načítání configu za běhu by přidalo další požadavek, CORS a cache.

**Doklad:** ZADANI.md:24 „dodaný jako jeden JS soubor“; ZADANI.md:54 dist/prace-na-zkousku.js; ZADANI.md:58 Vite v library mode; ZADANI.md:166 „aby je marketing mohl měnit bez zásahu do kódu“; ZADANI.md:140 poznámka obsahuje doporučený směr a kurz.

**Návrh:** Zeptat se Ondřeje, co znamená „bez zásahu do kódu“. Výchozí návrh: JSON v repozitáři, úprava přes pull request a automatický build a nasazení widgetu i endpointu ze stejného zdroje. V README popsat, kde a jak se cena mění.

### V2-3: Endpoint by zapisoval do Pipedrivu volný text z prohlížeče

*riziko, doplněno*

Payload nese hotovou větu opener, kterou endpoint dává do poznámky dealu i do aktivity. Token je v odkazu, takže ho zná každý, kdo odkaz uvidí. S tokenem jde poslat libovolný text a ten skončí v CRM u obchodníka. Validace přes schéma přijme jakýkoli řetězec v poli opener. Totéž platí pro ideaName a další texty, kdyby se posílaly.

**Doklad:** ZADANI.md:101 „opener“ jako text v payloadu; ZADANI.md:75 validace jen známých polí; ZADANI.md:140-142 opener v poznámce a aktivitě; ZADANI.md:64 token v URL.

**Návrh:** Na serveru brát jen výčtové a číselné hodnoty (status, tries, changes, idea jako klíč a podobně) a opener i poznámku skládat na serveru ze sdílené logiky (logic/sales.ts). Pole opener z payloadu vypustit nebo ignorovat.

### V2-4: Token ?pnz v adrese stránky může odejít do analytiky webu

*riziko, doplněno*

Odkaz do nástroje nese token v query (?pnz=TOKEN). Na coderslab.cz běží Google Tag Manager a měřicí značky běžně posílají celou URL stránky včetně query. Token by se tak dostal do analytiky a reklamních nástrojů, a s ním by šlo přepisovat výsledky u dealu. Odstranit token z adresy přes history.replaceState by zase byl zásah do stavu hostitelské stránky, který CLAUDE.md zakazuje.

**Doklad:** ZADANI.md:64 odkaz s ?pnz=TOKEN&utm_source=...; uložené HTML webu scratchpad/architektura/host-kurzy-data-analyst.html i host-page.html obsahují GTM-WRN8G32 (grep); CLAUDE.md „Nesahat na location.hash ani na jiný stav hostitelské stránky“. Konfiguraci GTM (jestli posílá query) jsem neověřoval.

**Návrh:** Zeptat se Ondřeje: buď povolit výjimku a token po přečtení z URL odstranit přes history.replaceState, nebo v GTM vyřadit parametr pnz z page_location. Endpoint by měl token chránit i limitem zápisů (už je v zadání).

### V3-1: Kritérium „Hrát vidět bez scrollování na 1366 × 768“ v embedu pod hlavičkou webu splnit nejde

*rozpor, doplněno*

ZADANI v kapitole 7 chce, aby bylo tlačítko Hrát na 1366 × 768 vidět bez scrollování. Kritérium neomezuje na samostatnou stránku. V prototypu je spodní hrana tlačítka 694 px při hlavičce 56 px, tedy 638 px od začátku widgetu. V embedu na 1366 px se widget po přepnutí obrazovky posune pod lepicí hlavičku webu s odstupem 176 px (na stránkách kurzů podle E2 199 px), k tomu je tu ještě světlý pruh s odznaky. Tlačítko pak končí aspoň na 814 px, tedy pod spodním okrajem okna 768 px. Platí to i pro data-start="hry" na stránce kurzu.

**Doklad:** ZADANI.md:193 „tlačítko Hrát je na 1366 × 768 vidět bez scrollování“; ZADANI.md:39 odstup 176; měření Playwright (Edge) skriptem C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/verify-sa/play.py na prototypu #hry: {'headerH': 56, 'viewTop': 56, 'playBottom': 694.2}; 694 − 56 + 176 = 814 > 768

**Návrh:** Ondřejovi navrhnout, že kritérium platí pro samostatnou stránku. V embedu na test-host.html stačí, aby bylo po přepnutí do hry vidět plátno a Hrát bylo dosažitelné krátkým posunem. Pokud trvá na viditelnosti i v embedu, je potřeba kompaktnější rozložení hry pro výšku okna minus odstup.

### V3-2: Funkce reveal() posouvá panely pod lepicí hlavičku webu, odstup se na ni nevztahuje

*mezera, doplněno*

Kromě přepnutí obrazovky prototyp posouvá stránku i uvnitř ukázek přes reveal(). Týká se to lišty s vyzvednutím odznaku, stavby a náhledu aplikace v AI a nástrojů editoru hry. reveal() volá scrollIntoView s block:'start' a podmínkou r.bottom < 80 bez jakéhokoli odstupu. ZADANI odstup data-scroll-offset popisuje jen pro přepnutí obrazovky. Web coderslab.cz nemá scroll-padding-top, takže na šířce od 1200 px skončí horní část odkrytého panelu (176 až 199 px) pod lepicí hlavičkou webu.

**Doklad:** prototyp:815-818 `function reveal(el){ ... if (r.top > window.innerHeight * 0.55 || r.bottom < 80) el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block:'start' });`; volání na :881, :1128, :1147, :1173, :1338; ZADANI.md:39 „Při přepnutí obrazovky se widget posune na svůj začátek o tento odstup“; v C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/coderslab-styles.css jediné pravidlo scroll-behavior `@media (prefers-reduced-motion: no-preference){:root{scroll-behavior:smooth}}`, scroll-padding ani scroll-margin 0 výskytů

**Návrh:** Ve widgetu používat jednu funkci pro posun, která počítá se stejným odstupem jako přepnutí obrazovky. Například cílovým prvkům nastavit scroll-margin-top podle odstupu a podmínku r.bottom < 80 posunout o odstup. Na test-host.html přidat test, že po vyzvednutí odznaku a po stavbě aplikace není horní hrana panelu pod hlavičkou.

## Nízká závažnost (23)

### T2: U počítaných slov a tvaru „N ze M“ nemá prototyp jednotný zápis

*otazka, potvrzeno*

CLAUDE.md:8 jmenuje jen jednotky (Kč, minut, %). Mezi číslem a počítaným slovem prototyp někdy dává U+00A0 a jindy ne, takže zadání „1:1“ tu není jednoznačné.

- Prvek #d-seen ukáže po načtení „Prohlédnuto 1 ze 4 pohledů na data“ s pevnou mezerou za 1 (985). Po druhém pohledu ukáže tutéž větu s obyčejnou mezerou (921).
- „412 pokusů“ má U+00A0 (1498, 1542), „(3 pokusy)“ a „(1 pokus)“ ne (1499, 1500).
- „krok 1 ze 3“ má U+00A0 (1536). Bez ní jsou „Máš 1 ze 4 odznaků.“ (826), „Zkouším 1 840 Kč pro 4 lidi“ (1000) a v openeru „dostal od vás 2 úpravy“ (1745).

Celkem 7 míst s U+0020 proti 3 místům s U+00A0.

**Doklad:** Edge dump.html: 'DATA d-seen init: Prohlédnuto␣1‧ze␣4␣pohledů' a 'DATA d-seen after 2nd view: Prohlédnuto␣2␣ze␣4␣pohledů'. node evidence.js: '1498 412[A0]pokusů', '1499 (3[20]pokusy)', '1536 krok[20]1[A0]ze[20]3'.

**Návrh:** Rozhodnout, zda pevná mezera platí i mezi číslem a počítaným slovem a v tvaru „N ze M“. Doporučuji ano: číslo pak nezůstane na konci řádku a slova se nemění. Potom zápis sjednotit na jeden tvar v cs.json.

### T7: Zaškrtávací políčko „Jsem student posledního ročníku…“ předpokládá muže

*otazka, castecne*

Věta „Jsem student posledního ročníku, nebo jsem bez práce a nepobírám podporu“ (687) používá generické maskulinum. Pravidlo CLAUDE.md:9 tím porušené není, protože zakazuje jen tvary jako „udělal(a)“. Neutrální znění („Studuji poslední ročník…“) je volitelný návrh pro Ondřeje, ne nutná oprava.

**Doklad:** prace-na-zkousku.html:687 '<span>Jsem student posledního ročníku, nebo jsem bez práce a nepobírám podporu</span>'. Prohledání všech 975 vytažených textů na tvary jsi, sám, byl, zvládl, student a podobné jiný případ v rozhraní nenašlo.

**Návrh:** Navrhnout Ondřejovi neutrální znění, například „Studuji poslední ročník, nebo jsem bez práce a nepobírám podporu“, a použít ho až po schválení.

### T8: Texty pro Pipedrive popisují člověka v mužském rodě

*otazka, potvrzeno*

Funkce updateSales() a opener() používají tyto tvary:
- „nebavilo ho to“ (1752, řádek Nejvíc bavilo)
- „zajímá ho, předat LifeScale Business“ (1759); podle ZADANI.md:144 má tento údaj stát výrazně na prvním řádku poznámky
- „Návštěvník zatím nic nedokončil.“ (1739); poznámka se odesílá i po zobrazení výsledku s 0 odznaky
- „k jeho leadu“ (1753, řádek Kontakt, který seznam v ZADANI.md:140 neobsahuje)

Jde jen do interní poznámky, u žen ale bude text špatně.

**Doklad:** Edge dump.html: 'SALES firm row: zajímá␣ho,␣předat␣LifeScale␣Business', 'SALES fav row: nebavilo␣ho␣to'. prace-na-zkousku.html:1739 'if (!k) return 'Návštěvník zatím nic nedokončil.';'

**Návrh:** Použít neutrální znění, například „nebavilo“, „zájem o školení přes firmu, předat LifeScale Business“ a „Zatím nic nedokončeno.“ Řádek Kontakt do poznámky nedávat. Schválit s Ondřejem spolu s celým textem poznámky.

### T11: Pevné mezery rozbijí strojová porovnání: volby v Pipedrivu, test openeru a referenční testy

*riziko, potvrzeno*

Tři problémy:

(1) META.ai.label je „Stavění aplikací s AI“ s U+00A0 za „s“ (743). Volba pole PNZ doporučený směr v ZADANI.md:125 má obyčejnou mezeru (ZADANI.md neobsahuje žádnou U+00A0). Když endpoint bude hledat volbu podle textu, nenajde ji a pole zůstane prázdné. U cíle se liší i samotná slova: poznámka má „zlepšit se ve stávající práci“ (1758), volba „zlepšit se v práci“ (ZADANI.md:126).

(2) Příklad openeru v ZADANI.md:101 má obyčejné mezery, prototyp ale vrací „…, a to hned napoprvé. Co vás na práci s daty bavilo?“ s U+00A0 za „a“ a „s“ (1742). Unit test napsaný podle ZADANI proto selže proti výstupu 1:1.

(3) check7.py:4 převádí U+00A0 i U+202F na mezeru a žádný referenční test nemá assert. Kritérium „včetně pevných mezer“ (ZADANI.md:185) tak dnes nic neověřuje.

**Doklad:** od -tx1 řádku 4 v check7.py: '5b c2 a0 e2 80 af 5d', tedy [U+00A0 U+202F]. grep assert v referencni-testy/*.py: 0 řádků. node evidence.js: '743 label:Stavění[20]aplikací[20]s[A0]AI', '1742 ,[20]a[A0]to[20]hned[20]napoprvé'. node inventory.js na ZADANI.md: U+00A0 0.

**Návrh:** Volby v Pipedrivu mapovat podle klíčů (data, ai, hry, kyber, switch, upskill) na ID voleb v konfiguraci endpointu, nikdy podle zobrazeného textu. Očekávané texty v testech brát z prototypu po jednotlivých znacích a přidat test pravidel bez normalizace mezer. S Ondřejem potvrdit, že platí výstup prototypu, ne příklad v ZADANI.

### Z17: Hodnoty pro enum v Pipedrivu se liší od popisků v prototypu

*rozpor, potvrzeno*

Cíl má tři různé podoby: enum „zlepšit se v práci“, panel „zlepšit se ve stávající práci“ a tlačítko „Chci se zlepšit ve své práci“. Popisek META.ai obsahuje pevnou mezeru („s⍽AI“), zatímco enum „Stavění aplikací s AI“ v ZADANI má obyčejnou. Porovnání podle textu by tedy selhalo a pole by zůstalo prázdné.

**Doklad:** ZADANI ř. 125 až 126. Prototyp ř. 743 'Stavění aplikací s⍽AI', 1704 až 1705, 1758.

**Návrh:** Payload posílat jen s klíči (data|ai|hry|kyber, switch|upskill) a v konfiguraci endpointu je mapovat na ID možností v Pipedrivu, nikdy podle textu.

### Z18: V seznamu odkazů v kap. 6 chybí školení pro firmy

*mezera, potvrzeno*

Prototyp odkazuje na https://coderslab.cz/cz/skoleni-pro-firmy a analytika má pro tuto výzvu typ skoleni_firmy, ale seznam odkazů pro config.json ho neuvádí. Interní odkazy #start a #vysledek (logo a ukazatel odznaků) musí být ve widgetu tlačítka, protože hash se měnit nesmí.

**Doklad:** Prototyp ř. 1710, 447, 449. ZADANI ř. 178, 157, 47.

**Návrh:** Přidat odkaz do config.json i do README. Logo a ukazatel převést na tlačítka s interní navigací.

### Z19: Výchozí data-scroll-offset 176 nesedí se součtem 60 + 59 + 56 = 175

*chyba-v-zadani, potvrzeno*

Součet výšek pruhů lepicí hlavičky je 175 px, výchozí hodnota a test-host počítají se 176 px. Buď je v hlavičce ještě 1px okraj, nebo je číslo špatně.

**Doklad:** ZADANI ř. 39 „výchozí 176 (... 60 px, ... 59 px a ... 56 px)“, ř. 56 „lepicí hlavička 176 px“.

**Návrh:** Změřit skutečnou výšku hlavičky na coderslab.cz a sjednotit výchozí hodnotu i test-host.

### A6: Vynechání hlavičky a panelu obchodníka shodí skript

*riziko, potvrzeno*

renderProgress() zapisuje do #prog-minis a #prog-text v tmavé hlavičce, updateSales() do #r-sales a #r-opener v panelu obchodníka. Zadání oba prvky ve widgetu vynechává. Kopie prototypu bez nich spadne hned při startu, takže se nespustí initData, initAI, hra, kyber ani route. Výsledek pak padá při každém zobrazení, protože renderResult volá updateSales, a totéž dělá interval každých 5 s.

**Doklad:** prototyp 811-812, 1765-1766, 1684 updateSales(); 1787 setInterval; proto-no-header-no-sales.html v Edge 156: dvakrát Uncaught TypeError: Cannot set properties of null (setting 'innerHTML'), dChartFilled false, sPanelFilled false.

**Návrh:** opener(), tags(), why() a sestavení poznámky přesunout do čisté funkce v logic/sales.ts sdílené s endpointem a interval zrušit. renderProgress psát do cíle podle varianty (tmavá hlavička nebo světlý pruh).

### A7: @container: hostitel se v úzkém rodiči smrskne na 0 a FAB řídí šířka okna

*riziko, potvrzeno*

Kvůli @container musí mít kontejner container-type: inline-size. Na :host to funguje (@container i cqi). Když ale web vloží widget do flex řádku bez šířky nebo do inline-block, má widget šířku 0 px. Plovoucí tlačítko se schovává podle window.innerWidth >= 880, takže v úzkém sloupci na notebooku se neukáže, i když rozložení podle @container už má jeden sloupec. Velikosti písma ve vw by se počítaly z okna. Breakpointy se v embedu posunou o okraje kontejneru, na screenshoty 390 a 1366 px to vliv nemá.

**Doklad:** container-collapse.html v Edge 156: a1 0x162 (flex), a2 0x162 (inline-block), a3 800x18 (width:100%), b1 0x162 (kontejner na vnitřním obalu); embed-mechanics.html @container 7, 10cqi 50; prototyp 927 window.innerWidth >= 880; vw 95, 96, 121, 163, 343.

**Návrh:** Na :host dát display:block, width:100% a container-type:inline-size. 17 šířkových @media převést na @container se stejnými hodnotami a vw na cqi. FAB řídit šířkou widgetu (ResizeObserver). Do test-host.html přidat i flex rodiče.

### A8: Shadow DOM neodřízne dědičnost a pravidla pro :root a body ve widgetu nic nechytí

*chyba-v-zadani, potvrzeno*

Zadání tvrdí, že Shadow DOM oddělí styly od Bootstrapu v obou směrech. Pro selektory to platí, ale děděné vlastnosti (písmo, velikost, řádkování, barva, zarovnání, prostrkání, tloušťka) procházejí z body webu dovnitř. Prototyp má základ na body a tokeny na :root a uvnitř shadow root nechytí nic z toho. Widget by převzal písmo a barvy webu a všechny var(--...) by byly prázdné.

**Doklad:** embed-mechanics.html: zděděno Georgia, 20px, 40px, rgb(1, 2, 3), center, 3px, 300; po all:initial Times New Roman 16px normal; proměnná z :root ve shadow root dala fallback 99; prototyp 12 :root{ a 43 body{margin:0; background:var(--bg); color:var(--ink); font:16px/1.6 var(--font); padding-bottom:40px; ...}; ZADANI.md:26.

**Návrh:** Tokeny a základ přesunout na :host s all: initial a hned potom nastavit display:block, font:16px/1.6 var(--font), color a background. Selektory html, body, *, a, p, h1-h4 a b (41-49, 299) přepsat na potomky :host a pravidlo [hidden] ponechat uvnitř shadow root. Na test-host.html testovat vypočtené styly.

### A11: Fokus se ztrácí při překreslení a při přepnutí obrazovky

*mezera, potvrzeno*

Zadání řeší jen návrat fokusu po zavření okna s odznakem. Fokus ale padá na body i jinde: show() skryje sekci s právě stisknutým tlačítkem, výsledek se po volbě „Co tě bavilo nejvíc“ nebo cíle překreslí přes innerHTML, kyberbezpečnost přepisuje panel po každém kroku a aplikace v AI po každém kliknutí. Na samostatné stránce je to nepříjemné. Ve widgetu začne další Tab od začátku webu, tedy od menu coderslab.cz. Nativní dialog navíc vrací fokus na tlačítko „Vyzvednout odznak“, které je v tu chvíli skryté, takže návrat fokusu je potřeba napsat ručně.

**Doklad:** prototyp 771 (skrytí sekcí), 1712 reco.innerHTML = h; a 1718, 1720 (renderResult po kliknutí); 1555 $('#s-panel').innerHTML = h; 1025, 1058, 1094; 820 a 867 (closeCel jen nastaví hidden, tlačítko pro vyzvednutí se skryje); embed-mechanics.html: skryté fokusované tlačítko [BODY, null].

**Návrh:** Po přepnutí obrazovky a posunu dát fokus na h2 nové obrazovky (tabindex=-1, preventScroll). Po překreslení výsledku a panelu kyber vrátit fokus na odpovídající prvek podle data-atributu. Po zavření okna dát fokus ručně na první odkryté tlačítko. Doplnit do akceptačních kritérií.

### A15: Modul z jiné domény potřebuje CORS a ochranu proti dvojí registraci

*riziko, potvrzeno*

Prohlížeč stahuje script type=module z jiného originu v režimu CORS. Hosting proto musí posílat Access-Control-Allow-Origin, jinak se widget nenačte. coderslab.cz běží na GitHub Pages: tam jde JS dát na stejný origin, ale endpoint POST /api/pnz tam běžet nemůže. Kdyby se skript vložil dvakrát, customElements.define vyhodí chybu.

**Doklad:** curl -I https://coderslab.cz/cz: Server: GitHub.com; výchozí CORS hlavičky Netlify a Vercelu: neověřeno; ZADANI.md:31-32 a 72.

**Návrh:** Do otázky 9.1 doplnit, že web je na GitHub Pages. Pokud JS poběží jinde, nastavit v hostingu Access-Control-Allow-Origin pro coderslab.cz a vyzkoušet test-host.html z jiného originu. Registraci podmínit customElements.get('prace-na-zkousku').

### A17: Mrtvý a křehký kód, který by se přenesl

*chyba-v-prototypu, potvrzeno*

aiBtns se zapisuje a nikde nečte. deadTimer se ruší, ale nikdy nenastaví. [data-chip] neodpovídá žádnému prvku a setInterval s 5 s běží navždy. Asynchronní kroky v AI a kyberbezpečnosti (wait) běží dál i po odchodu z obrazovky a markDone po 400 ms volá reveal() na skrytý prvek, v Edge bez efektu. Prototyp nemá žádný úklid, custom element bude potřebovat disconnectedCallback pro rAF, posluchače, IntersectionObserver a časovače. Plátno se přepočítá jen při window resize, ne když se změní šířka sloupce.

**Doklad:** prototyp 1149, 1154, 1159 (aiBtns); 1198, 1321, 1391, 1471 (deadTimer); 772 $$('[data-chip]'); 1787 setInterval; 1137-1144 a 1164-1168 (await wait); 1525 a 1605-1607; 881 setTimeout(() => reveal($(bar)), 400); 1467 window.addEventListener('resize', () => { if (visible) resize(); }); embed-mechanics.html: scrollIntoView skrytého prvku posun 0.

**Návrh:** Při přenosu mrtvý kód vyhodit. Asynchronní kroky rušit přes AbortController při odchodu z obrazovky a v disconnectedCallback. Plátno přepočítávat přes ResizeObserver na .canvas-box.

### R5: Kroky bez protějšku ve widgetu: hash, #r-sales, passgate, obrazovka výsledku a file://

*test, potvrzeno*

- Navigace přes hash: check6.py:19, 26, 32, 37; check7.py:20, 54, 72; gametest.py:17; hiddencheck.py:7. README ji radí nahradit atributem data-start, ten ale nezná vysledek (ZADANI.md:37), takže hiddencheck pro výsledek musí projít úlohou.
- check7.py:47-48 čte #r-sales (školení přes firmu, kontakt) z panelu „Pohled obchodníka“, který se nepřebírá (ZADANI.md:18). text_content na chybějícím prvku čeká 30 s a pak shodí celý skript bez jediného řádku výstupu, protože výsledky se tisknou až na konci (check7.py:90).
- passgate (check6.py:5-11, check7.py:7-13, gametest.py:5-11) vyplňuje jméno, e-mail, telefon a souhlas. V prototypu žádná brána není, je to mrtvý kód a odporuje pravidlu, že nástroj kontakt nesbírá.
- Testy načítají 'file://' + P, ale ES modul widgetu se přes file:// nenačte.

**Doklad:** - probe3.out.txt: „1 file:// type=module -> not-run | console: ["error: Access to script at 'file:///...' ...", 'error: Failed to load resource: net::ERR_FAILED']“.
- check7.py:47 „norm(await pg.text_content('#r-sales')).split('Školení přes firmu')[1][:45]“.
- README.md:12; ZADANI.md:37 „`data-start`: `start`, `data`, `ai`, `hry`, `kyber`“.

**Návrh:** - Navigovat přes data-start, ?ukazka= a klikání.
- Místo #r-sales zachytit požadavek na data-api (page.route) a ověřit firmInterest, goal, fav, lowIncome a paths. Text poznámky (školení přes firmu výrazně na prvním řádku, opener) testovat unit testem endpointu.
- passgate nepřenášet.
- V playwright.config spustit vite preview jako webServer na localhost a tento origin povolit v CORS endpointu pro vývoj.
- Každý krok psát jako samostatný test.

### R10: Pevné čekací doby mají rezervu kolem 0,3 s a herní čas závisí na snímkové frekvenci

*test, potvrzeno*

Naměřené rezervy:
- první pád přijde 2 257 ms po kliknutí na Hrát a Hrát znovu se znovu aktivuje v +3 165 ms; gametest kontroluje v +2 600 ms, takže rezerva je 343 ms před pádem a 565 ms do aktivace;
- vlastní level je dohraný v +3 547 ms, test čeká 3 900 ms (rezerva 353 ms);
- nasazení opatření v Kyberbezpečnosti trvá 2 100 ms, testy čekají 2 400 ms.

Hra omezuje krok na 0,05 s za snímek (řádek 1314). Pod 20 snímků za sekundu proto herní čas běží pomaleji než skutečný a pevné čekání selže. Neaktivitu Hrát znovu po dobu asi 0,9 s ověřuje gametest jediným vzorkem.

**Doklad:** - probe_proto.out.txt: „G game timeline (ms after the latest click): click@+0ms; ... status@+2257ms Spadla do díry...; disabled=true@+2257ms; disabled=false@+3165ms; ... status@+3547ms Tvůj vlastní level je dohr“.
- gametest.py:19 wait_for_timeout(2600), :36 wait_for_timeout(3900); check6.py:24 a check7.py:82 wait_for_timeout(2400).
- probe_clock.out.txt: „('+2200', 'Klepni kamkoli d', False), ('+2300', 'Spadla do díry. ', True), ('+3300', 'Spadla do díry. ', False) ... ('editor visible', True)“.

**Návrh:** Ve hře používat page.clock (install, runFor). Na prototypu to funguje a pád i okno 0,9 s jdou ověřit přesně. Jinde místo wait_for_timeout čekat na stav (toBeVisible, toHaveText, expect.poll). Pro rychlé toky zvážit reducedMotion: 'reduce', kdy prototyp zkracuje čekání na 0 (řádek 732), ale animace a konfety testovat i bez něj.

### S4: Pro většinu stavů chybí referenční snímek

*mezera, potvrzeno*

11 snímků pokrývá úvod, data, hru v klidu, okno s odznakem, AI na notebooku, kyber v kroku 1 a výsledek. Chybí: Stavění s AI a Kyberbezpečnost na mobilu, okno s odznakem na notebooku, AI před stavbou a v tmavém vzhledu, hra při hraní, po pádu, v editoru a po dohrání, kyber v krocích 2 a 3 a hotový, výsledek bez odznaku („Zatím nemáš žádný odznak“), výsledek s cílem „Chci se zlepšit ve své práci“ a boxem školení přes firmu, výsledek se zaškrtnutou nízkopříjmovou skupinou, okno se 4 ze 4 odznaků. Dále šířky mimo 390 a 1366 px, i když rozložení se mění na 419, 480, 560, 720, 880 a 1000 px, a samostatná hlavička bez štítku Prototyp. Pro tyto stavy zbývá jen pokyn „udělej to jako prototyp“.

**Doklad:** prototyp/screenshoty obsahuje 11 PNG (Glob); zlomy například prototyp:70 `@media (max-width:419px)`, :126 `(max-width:1000px)`, :173 `(max-width:880px)`, :214 `(max-width:480px)`, :233 `(max-width:720px)`; prázdný výsledek prototyp:670-674; box pro firmy prototyp:1706-1711

**Návrh:** U těchto stavů brát vzhled a chování z živého prototypu. Až Ondřej schválí vzhled nové verze, vygenerovat baseline i pro ně, aby regresní testy hlídaly víc než 11 stavů.

### S8: Ve výsledku na mobilu neodpovídá pořadí Tab tomu, co je vidět

*chyba-v-prototypu, potvrzeno*

Na mobilu jsou bloky pod sebou v pořadí doporučení, cena, „Co dál“ a „Další práce na zkoušku“ (check7 to testuje). V DOM je ale #r-others-box před #r-side. Klávesnice i čtečka proto z doporučení skočí dolů na „Další práce“ a pak zpátky nahoru na cenu a „Co dál“. Hlavní výzva (webinář nebo minikurz) tak přijde až po odkazech na další ukázky.

**Doklad:** prototyp:677-697 pořadí `#r-reco`, `#r-others-box`, `#r-side`; prototyp:338 `grid-template-areas:"reco" "side" "others"`; resultFocusOrder390 v C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/a11y2.json, svislá pozice v dokumentu: doporučení 600 až 797 px, další práce 1744, 1802, 1860, cena 1269, Co dál 1494, 1548, 1628; referencni-testy/check7.py:42-43

**Návrh:** V nové verzi dát #r-side v DOM před #r-others-box. Rozložení na notebooku určují grid-template-areas, takže se nezmění, a test pořadí bloků z check7 dál projde.

### S9: Šířky 320 až 430 px referenční testy nehlídají a prototyp na 320 px přetéká

*test, potvrzeno*

ZADANI tvrdí, že referenční testy pokrývají i přetečení. check6.py ale měří šířku jen v Kyberbezpečnosti, a to na 390 a 1366 px. Na 320 až 329 px prototyp přetéká o 10 px na každé obrazovce, protože štítek „Prototyp“ odtlačí ukazatel odznaků (pravý okraj 330,1 px). Bez štítku je přetečení 0 px na všech obrazovkách při 320, 360, 375, 390, 414 i 430 px. Platí to i pro Kyberbezpečnost po všech příkazech, všechny tři AI aplikace se všemi úpravami, okno s odznakem a výsledek s boxem pro firmy. Světlý pruh embedu změřit nejde, protože neexistuje.

**Doklad:** referencni-testy/check6.py:15 `for (w, h) in [(390, 844), (1366, 768)]:`; ZADANI.md:188-189; overflow při 320 px v C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/a11y.json: `sw=330`, offender `a.prog[href="#vysledek"]`, `'right': 330.1`; C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/a11y2.json `{'asIs': 330, 'withoutPrototypTag': 320, 'firstWidthWithoutOverflow': 330}`; snímek hlavičky C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/header-320.png

**Návrh:** Do nových testů přidat smyčku přes šířky 320, 360, 375, 390, 414 a 430 px pro všechny obrazovky i okno s odznakem. Spouštět ji na samostatné stránce i v embedu na test-host.html a hlídat scrollWidth dokumentu i hostitelské stránky.

### S10: Kontrast: zástupný text, neaktivní tlačítka a logo

*chyba-v-prototypu, potvrzeno*

Běžný text má všude aspoň 4,5:1. Pod hranicí jsou jen tyto případy:
- Zástupný text „Nový návyk“ v trackeru návyků (#757575): 4,37:1 na #F8F9FA, v tmavém vzhledu 2,89:1.
- Použité úpravy v AI, které zůstanou jako neaktivní tlačítka s průhledností 0,45: 2,72:1.
- Obsazené časy v tmavém vzhledu: 3,25:1.
- Bílé L v logu na žluté: 1,73:1.
WCAG neaktivní prvky a loga vyjímá, ZADANI ale chce 4,5:1 bez výjimky. Neaktivní tlačítko přitom nese informaci, že úprava už proběhla.

**Doklad:** aiIdeas.navyky v C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/out/a11y.json: `{'sel': '#ap-new', 'fg': '#757575', 'bg': '#2B3035', 'ratio': 2.89}`, ve světlém vzhledu 4.37 (výstup C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/a11y3.py); ai_done: `'Přidej výběr služby' ... 'ratio': 2.72 ... 'opacity': [0.45]`; prototyp:80 `.btn:disabled{opacity:.45`, :265 `.app-btn:disabled{opacity:.4`, :1093 `placeholder="Nový návyk"`, :56 `.logo-mark span{color:#FFFFFF}`

**Návrh:** Zástupnému textu nastavit vlastní barvu: #5F676F ve světlém a #ADB5BD v tmavém vzhledu. U neaktivních tlačítek a loga potvrdit s Ondřejem výjimku podle WCAG. Případně použitou úpravu označit jinak než průhledností, například fajfkou.

### S11: Snímky zachycují chybné zalomení čísel, oprava podle CLAUDE.md zalomení změní

*rozpor, potvrzeno*

Na mobil-vysledek končí řádek slovy „…vyškolili víc než 2“ a „500 lidí.“ je až na dalším řádku. Důvod: v prototypu je mezi 2 a 500 obyčejná mezera. Obyčejné mezery jsou i v „Dotace až 35 000 Kč“, v „57 600 Kč“ (na kartě i v misi v datech) a v „asi 5 minut“ v Dalších pracích. CLAUDE.md chce pevné mezery v tisících a před jednotkou, ale zároveň zakazuje měnit texty bez souhlasu. Po opravě se texty místy zalomí jinak než na snímcích.

**Doklad:** Výstup C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/nbsp.py: prototyp:689 `víc než 2 500[NB]lidí` (mezi 2 a 500 je U+0020), :465 `Dotace až 35 000 Kč` bez U+00A0, :502 a :543 `57 600 Kč` bez U+00A0, :1725 `'asi 5 minut'`; CLAUDE.md „Tisíce se oddělují pevnou mezerou.“ a „Texty se přebírají z prototypu 1:1 a bez souhlasu se nemění.“

**Návrh:** Nechat Ondřeje potvrdit, že doplnění pevných mezer se nepočítá jako změna textu. Při generování nových baseline počítat s tím, že tato místa se zalomí jinak.

### S12: Záložky v Datové analýze se neovládají šipkami

*chyba-v-prototypu, potvrzeno*

Přepínač pohledů má role tablist a tab, ale šipky nic nedělají. Všechny čtyři záložky jsou samostatné zastávky Tab a chybí aria-controls. Čtečka je tedy ohlásí jako záložky, ale chovají se jako obyčejná tlačítka. Panel #d-chart má navíc aria-live="polite", takže čtečka může při každém přepnutí číst celý graf (neověřeno se čtečkou).

**Doklad:** prototyp:547-553 `role="tablist"`, `role="tab"`, `<div id="d-chart" role="tabpanel" aria-live="polite">`; výstup C:/Users/ondre/AppData/Local/Temp/claude/C--Users-ondre-OneDrive-Desktop-zadani-prace-na-zkousku/58d22649-2bc1-4676-b1e6-b039409658d6/scratchpad/a11y/a11y3.py po ArrowRight na „Po měsících“: `{'focused': 'mesice', 'selected': 'mesice', 'tabindex': [None, None, None, None], 'ariaControls': [None, None, None, None]}`; grep `Arrow(Left|Right|Down)|aria-controls` v prototypu: 0 výskytů

**Návrh:** Buď doplnit celý vzor záložek (šipky, tabindex jen na vybrané záložce, aria-controls), nebo role tab odstranit a nechat obyčejná přepínací tlačítka s aria-pressed. aria-live dát jen na krátkou větu se shrnutím pohledu.

### E9: Skript na založení polí: Pipedrive dovolí duplicitní názvy a klíče jsou hashe

*riziko, potvrzeno*

V účtu už jsou dvě pole CM Event ID a dvě pole CM Room name. API tedy pole se stejným názvem založí znovu. Opakované spuštění skriptu by vytvořilo duplicity a endpoint by pak mohl zapisovat do jiného pole, než které vidí obchod. Klíč pole (field_code) je 40znakový hash, který vznikne až při založení. Typ text z tabulky v ZADANI je v Pipedrive „Large text“. Krátký „Text“ je typ varchar (do 255 znaků), jaký mají i pole ad_*. Nová pole se ve výchozím stavu zobrazí ve všech pipeline.

**Doklad:** getAccountContext: 'CM Event ID' | fbb1a2ac2f907338aec52e4fb689f7349f37eb78 a 'CM Event ID' | 1e3e950bf6592aa92739e94c3fe59d82e9cf1405; 'CM Room name' 4edae6b9… a 66bbbbb4…; 'ad_source' | e29129325f1260c8cf9bbff02f54c31030ef5e3e | varchar. ZADANI.md:122 „| PNZ token | text |“. https://developers.pipedrive.com/docs/api/v1/DealFields: POST /api/v2/dealFields (cost 5), options [{label}], show_in_pipelines.show_in_all výchozí true. https://pipedrive.readme.io/docs/core-api-concepts-custom-fields: varchar „up to 255 characters“.

**Návrh:** Skript nejdřív načte GET /api/v2/dealFields a pole se stejným názvem nezaloží znovu. Klíče polí a id možností vypíše do konfigurace endpointu a v DRY_RUN jen ukáže, co by založil. PNZ token založit jako varchar. Zeptat se, jestli nová pole omezit na pipeline Studenti (show_in_pipelines).

### E13: LifeScale Business má samostatný Pipedrive, předání jde zatím jen přes poznámku

*otazka, potvrzeno*

Druhý připojený Pipedrive patří jiné firmě (LifeScale, pipeline B2B Sales 2.0 a další), ne Coders Labu. ZADANI posílá zájem o školení přes firmu jen jako první řádek poznámky v Pipedrivu Coders Labu. Obchod LifeScale tak signál uvidí, jen když se do dealu Coders Labu sám podívá.

**Doklad:** getAccountContext (mcp__60aa0395…): company_domain „lifescalebusiness“, pipelines B2B Sales 2.0 (6), Peakforce (7), Speed-dating (10), žádná pipeline Studenti. ZADANI.md:144 „signál pro předání do LifeScale Business. Do poznámky ho napiš výrazně na první řádek.“

**Návrh:** Zeptat se, jestli stačí poznámka, nebo má endpoint při firmInterest navíc založit lead v Pipedrivu LifeScale (druhý token) či poslat upozornění. Výchozí řešení podle ZADANI: jen poznámka.

## Vyvrácené

- T10: Pravidlo DIGIkurzů: přímé porušení jsem nenašel, dvě místa je třeba potvrdit. Auditor sám žádné porušení nenašel a oba body (a) a (b) jsou podle něj neověřené domněnky. Věta na 1708 popisuje jinou cestu (školení platí firma), ne placení spoluúčasti, a „0 Kč“ při nízkopříjmové skupině odpovídá textu na 1677 (úřad může zaplatit celou cenu). ZADANI.md:179 už rozhoduje, že se texty přebírají beze změny, takže tu není co rozhodnout.

## Opravená fakta

- (zadani-vs-prototyp) Editor se odemyká při pádu ve fázi 1, když plays ≥ 3. Oprava: Neúplné. Editor se odemkne i výhrou ve fázi 1 bez ohledu na počet her (1376-1377 'unlockEdit("Super, máš to!"…)'). Pravidlo „po třech pádech“ ze ZADANI.md:193 tedy platí jen pro hráče, kteří výchozí level nedohrají.

- (texty) Pravidlo 8: hraniční místa jsou 2 (1708 a zobrazení 0 Kč), k potvrzení podmínek DIGIkurzů. Oprava: Nejde o hraniční porušení. 1708 popisuje jinou cestu (školení platí firma), ne placení spoluúčasti, a „0 Kč“ odpovídá textu na 1677 (úřad může zaplatit celou cenu, nejvýš 35 000 Kč). Žádné porušení.

- (architektura) CSS: 19 pravidel @media. 17 závisí na šířce a patří do @container. Oprava: Šířkových @media je 17, ale ne všechna se převádějí. Ř. 411 patří panelu „Pohled obchodníka“, který se nepřebírá. Ř. 69 a 70 patří tmavé hlavičce a pruhu odznaků v ní, takže v embedu odpadnou nebo se přepíšou pro nový světlý pruh. Do @container se tak převádí 14 pravidel, ve standalone 16.
