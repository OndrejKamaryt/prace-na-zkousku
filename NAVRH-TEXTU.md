# Návrh textů ke schválení (zjednodušení podle schůzky 4. 11.)

Škrtnuté je dnešní znění, za šipkou nové. Co tu není, zůstává beze změny. V kódu budou pevné mezery podle `CLAUDE.md` (za k, s, v, z, o, u, a, i, mezi číslem a jednotkou, v tisících).

## Celý nástroj

- „Zpět na výběr“ nahoře zmizí. Dole na každé ukázce bude sekce **Zkus si další příklady**: karty ostatních ukázek (obor a název jako na úvodu) se stavem „asi 5 minut“, „Hotovo ✓“ nebo „Přeskočeno“.
- Po dokončení ukázky krémový pruh s větou (viz níže u ukázek) a tlačítkem **Můj výsledek**. Místo „Vyzvednout odznak“, okna s odznakem a konfet.
- V hlavičce místo „Odznaky n/4“ tlačítko **Můj výsledek** (otázka 3).
- Zmizí všechny texty odznaků: „Moje odznaky“, „Odznaky“, „Vyzvednout odznak“, „Zkusit další práci“, celé okno s odznakem („Nový odznak“, „Máš {n} ze 4 odznaků…“) a názvy odznaků.
- Stavění s AI se nikde nenabízí, `?ukazka=ai` otevře úvod. Kód a texty zůstávají.

## Úvod

Zůstává rozcestník se třemi kartami: Datová analýza, Tvorba her, Kyberbezpečnost. Pruh s odznaky pod kartami zmizí.

- Podnadpis: ~~Čtyři pětiminutové ukázky skutečné práce.~~ → ~~Tři pětiminutové ukázky skutečné práce.~~ → **Tři krátké ukázky skutečné práce.** Stačí zkusit jednu a hned uvidíš, co ti sedí. (12. 11., IT admin trvá 2 minuty)
- Karta dat, popis: ~~Zahraj si na detektiva v datech z pokladny a najdi, kam zmizelo 57 600 Kč.~~ → **Projdi s majitelkou data z pokladny a zjisti, proč kavárna v březnu vydělala méně.**
- Karta hry, nadpis: ~~Zahraj si a postav level~~ → **Zahraj si hru a uprav ji**
- Karta hry, popis: ~~Nejdřív si level zahraj, pak ho předělej podle sebe.~~ → **Nejdřív si hru zahraj, pak ji předělej podle sebe.**

## Datová analýza: práce analytika (schváleno 5. 11., nahrazuje klikačku po třech krocích)

Návštěvník rozhoduje, co analytik udělá dál, a v grafech kliká přímo na sloupce. Klikací koncept je v `prototyp/data-koncept.html`, ostrá verze v `src/content/cs.json`.

Nadpis zůstává: „Proč kavárně Zrnko v březnu klesly tržby?“

Stopy nad jevištěm: Kdy?, Které dny?, Co chybí? Plní se postupně.

Jana na začátku: **Ahoj, v březnu jsme vydělali nějak málo a vůbec nevím proč. Nemrkneš na to? Jsi přece náš datový analytik.**

**Co uděláš jako první?**
- Navrhnu slevovou akci na březen → Jana: Slevu? Vždyť ještě nevíme, co se stalo.
- Stáhnu si data z pokladny (správně)
- Rovnou udělám prezentaci → Jana: Prezentaci o čem? Zatím nemáš jediné číslo.

**Z tolika řádků nic nevyčteš. Co uděláš?**
- Projdu účtenky jednu po druhé → Jana: 9 660 účtenek? Budeš u toho do Velikonoc.
- Smažu všechno kromě března → Jana: Bez ostatních měsíců nepoznáš, co je normální. Potřebuješ srovnání.
- Sečtu tržby po měsících (správně)

**Klikni na měsíc, který nesedí.**
- Leden → Jana: Leden vypadá normálně. Hledej nejnižší sloupec.
- Únor → Jana: Únor vypadá normálně. Hledej nejnižší sloupec.
- Duben → Jana: Duben vypadá normálně. Hledej nejnižší sloupec.
- Správně: Březen je o 57 600 Kč níž než únor. Stopa: „v březnu“.

**Jak březen rozebereš dál?**
- Porovnám dny v týdnu s únorem (správně)
- Zjistím, jestli v březnu pršelo → Jana: Počasí může hrát roli, ale nejdřív vytěž data, která máš.
- Napíšu Janě, ať víc propaguje kavárnu → Jana: Zatím nevíš, co se pokazilo. Hledej dál.

**Klikni na dny, kdy březen propadl.**
- Pondělí → Jana: V pondělí je březen skoro stejný jako únor.
- Úterý → Jana: V úterý je březen skoro stejný jako únor.
- Středa → Jana: Ve středu je březen skoro stejný jako únor.
- Čtvrtek → Jana: Ve čtvrtek je březen skoro stejný jako únor.
- Pátek → Jana: V pátek je březen skoro stejný jako únor.
- Správně: O víkendu chybí 55 500 Kč. Všední dny jsou v pořádku. Stopa: „o víkendu“.

**Co se o víkendu změnilo? Jak to zjistíš?**
- Spočítám průměrnou účtenku → Jana: Průměr ti neřekne, co přesně chybí. Potřebuješ vidět jednotlivé položky.
- Rozdělím tržby podle produktů (správně)
- Seřadím účtenky podle času → Jana: Čas už znáš, je to víkend. Teď hledej co.

**Klikni na produkt, který zmizel.**
- Káva a nápoje → Jana: Káva a nápoje se prodávají skoro stejně jako v únoru.
- Dezerty → Jana: Dezerty se prodávají skoro stejně jako v únoru.
- Obědové menu → Jana: Obědy se prodávají skoro stejně jako v únoru.
- Správně: Snídaně spadly z 62 100 na 9 300 Kč. Ostatní se prodává skoro stejně. Stopa: „snídaně“.

**Máš všechno. Co napíšeš Janě?**
- Lidé přestali chodit, to se stává. → Jana: Kávu si kupují pořád stejně, lidé chodí dál.
- Zdražte kávu, to tržby vrátí. → Jana: Káva problém není. Opravovala bych něco, co funguje.
- V březnu o víkendu skoro nebyly snídaně. Stálo vás to 52 800 Kč. (správně)

Po dvou špatných: **Správná odpověď svítí.**

Stahování dat: `pokladna_zrnko.csv`, 9 660 účtenek (počet je dopočítaný z tržeb při zhruba 120 Kč na účtenku).

Jana na konci: **Aha! V březnu nám odešel kuchař a o víkendu snídaně nikdo nedělal. Díky, hned to řeším!**

Výsledek: **Zmizely víkendové snídaně**, 52 800 Kč, **Tolik kavárnu stál jeden měsíc bez víkendových snídaní.** **Přesně tohle dělá datový analytik: z čísel zjistí, co se ve firmě děje, a pomůže rozhodnout, co s tím.**

Rozbalovací „Jak na to přijde datový analytik“: **SQL je jazyk, kterým se analytik ptá databáze. Napíše, co chce vědět, a databáze mu i z milionů řádků vrátí jen odpověď. Každý graf v téhle ukázce vznikl z jednoho takového dotazu. Tenhle říká: sečti tržby za únor a březen a rozděl je podle produktů.** Ukázka SQL. **Menší data zvládne i kontingenční tabulka v Excelu. Nemusíš tomu teď rozumět, na kurzu se to naučíš od nuly.**

Pruh: **Hotovo, víš, proč tržby klesly!**

## Tvorba her (schváleno 5. 11., úpravy 8. 11.)

Koncept v `prototyp/hra-koncept.html` má ještě bugy, cedule, kód a logo CL na postavičce, Ondřej je 8. 11. vyřadil. Platí tenhle text.

Nadpis zůstává: „Zahraj si hru a pak ji uprav“

Podnadpis: **Běžíš z Coders Labu do svého prvního herního studia. Postavička běží sama, ty jen skáčeš. Sbírej mince a vyhýbej se bodcům.**

Na začátku: **Zmáčkni Hrát a pak klepni kamkoli do hry.**

Přehled na plátně: životy, mince, body a rekord {n}.

Nástroje:
- **Přidej plošinu:** Postava po ní běží a dá se na ni vyskočit.
- **Přidej nástrahu:** Když se jí postava dotkne, přijde o život. Těžší hra, víc bodů.
- **Přidej mince:** Jsou odměna, sbíráš za ně body.
- **Přidej trampolínu:** Vystřelí postavu vysoko nad nástrahy.
- **Smazat:** Klepni na věc ve hře a zmizí.

Pády: **Au, bodce!** Postavička narazila do zdi. Spadla do díry. Zmáčkni Hrát znovu a zkus to ještě jednou.

Po třetím pádu: **Životy došly, ale nevadí, i herní designéři ladí obtížnost. Uprav hru, aby šla projít, třeba zasyp díru plošinou.**

Moc pádů ve vlastní verzi: **Je to moc těžké? Herní designér obtížnost ladí, zkus nástrahu posunout nebo přidat plošinu.**

První výhra: **Máš to! Zkus to znovu na tři hvězdy, nebo hru uprav. Teď ji navrhuješ ty.** Karta: Jsi ve studiu!

Vlastní verze: **Tvoje verze hry je dohraná! Každá nástraha navíc je 50 bodů, zkus ji udělat těžší.** Karta: Tvoje hra je dohraná!

Karta dál: hvězdy, {n} bodů, Nový rekord! nebo Rekord: {n}

Hvězdy: Cíl, Všechny mince, Bez ztráty života, Těžká verze: aspoň 3 nástrahy. Třetí je „Bez ztráty života“ v původní hře a „Těžká verze: aspoň 3 nástrahy“ ve vlastní verzi.

Výzvy herního designéra {n}/{total}: Přidej nástrahu, Přidej mince, Přidej trampolínu, Dohraj svou verzi

Pruh: **Hotovo, tvoje verze hry je dohraná! V Unreal Enginu 5 se stejně skládají celé herní světy, ve 3D a bez programování.**

## IT administrátor (schváleno 5. 11., pekárna místo Coders Labu 8. 11., Martinovo zadání UX 12. 11.)

Platí texty schválené 12. 11. v `NAVRH-KYBER-UX.md` (Martinovo zadání UX-01 až UX-12). Koncept v `prototyp/admin-koncept.html` je starší a má ještě server Coders Labu. V kódu jsou pevné mezery podle `CLAUDE.md`.

Nadpis: **Někdo se dobývá do serveru pekárny**

Podnadpis: ~~Staráš se o server pekárny Kvásek, přes který chodí objednávky z kaváren. Čím rychleji a přesněji zasáhneš, tím víc hvězd získáš. Všechno uděláš tlačítky, nic psát nemusíš.~~ → **Staráš se o server pekárny Kvásek, přes který chodí objednávky z kaváren.**

Délka: jen u IT admina **2 minuty** (štítek nad nadpisem a karta na úvodu), v dalších příkladech **asi 2 minuty**. Ostatní ukázky mají dál „5 minut“.

Úvod přes herní box: štítek **Tvůj první zásah, 2 minuty**, nadpis **Někdo se dobývá do serveru pekárny Kvásek**, text **Jsi správce serveru. Najdi útočníka, zavři mu dveře a zabezpeč server. Všechno uděláš tlačítky.**, tlačítko **Začít zásah**, hvězdy **Za rychlost**, **Za správná rozhodnutí**, **Za ubráněný server**.

Přehled nahoře: Zabezpečení serveru, Čas zásahu, Pokusy útočníka, **Hvězdy** (a počet „{n}/3“). Mapa útoku: Kvásek, útočník, zablokováno, legenda **útočník**, **běžní uživatelé**, **server Kvásek**. Na mobilu má terminál sbalovací lištu **Terminál** (slovo z Martinova nákresu F).

Tereza, pekárna Kvásek, začátek: **Promiň, že budím. Od 3:00 se někdo pořád dokola pokouší přihlásit na server s objednávkami. Mrkneš na to?**

U každého příkazu je ikona ⓘ s vysvětlením a po spuštění shrnutí pod tlačítkem:

| Příkaz | ⓘ | Shrnutí |
|---|---|---|
| Ukázat neúspěšná přihlášení | Vypíše poslední 4 neúspěšné pokusy o přihlášení ze záznamu serveru. | Někdo zkouší hesla k účtům root, admin a petra, pořád ze stejné adresy. |
| Spočítat pokusy podle adresy | Vybere neúspěšná přihlášení a spočítá je podle IP adresy. | Jedna adresa to zkusila {n}×, ostatní jen jednou nebo třikrát. To bude útočník. |
| Zablokovat adresu útočníka | Přidá do firewallu pravidlo, které zahodí vše z této adresy. | Hotovo, útočník se k serveru už nedostane. |
| Ukázat, kdo se přihlásil | Vypíše poslední úspěšná přihlášení včetně IP adresy. | Pozor: ve 3:12 se z adresy útočníka přihlásil účet petra. |

Krok 1 ze 3, Najdi útočníka: Server si zapisuje každý pokus o přihlášení. Podívej se na ty, které neprošly. Tlačítko „Ukázat neúspěšná přihlášení“. ~~Tereza: Všechny jdou z jedné adresy a zkouší různá jména: root, admin, petra. Spočítej, kolik pokusů přišlo odkud.~~ → pokyn **Spočítej, kolikrát to zkusila která adresa.** Tlačítko „Spočítat pokusy podle adresy“. **Klikni na adresu útočníka.**
- 198.51.100.23: ~~Tři pokusy? To je nejspíš někdo z kanceláře, kdo si spletl heslo.~~ → **Tři pokusy jsou nejspíš někdo z kanceláře, kdo si spletl heslo.**
- 192.0.2.10: Jeden neúspěšný pokus je běžný překlep.

Krok 2 ze 3, Zavři dveře: **Správně! Tolik pokusů za pár minut nezkouší člověk, ale program, který hádá hesla. Zablokuj ho.** Tlačítko „Zablokovat adresu útočníka“ (žluté, už ne červené). ~~Útočník je venku, útoky se odrážejí. Jen zkontroluj, jestli se mezitím nedostal dovnitř.~~ → **Útočník je venku. Jen zkontroluj, jestli se nestihl dostat dovnitř.** Tlačítko „Ukázat, kdo se přihlásil“. ~~Ve 3:12 se z adresy útočníka přihlásila Petra. Jenže Petra chodí do práce z kanceláře a ve tři ráno spí. Co uděláš s jejím účtem?~~ → **Ve 3:12 se z adresy útočníka přihlásila Petra. Jenže Petra ve tři ráno spí.** Otázka **Co uděláš s Petřiným účtem?**
- Účet smažu i se všemi daty. → ~~Smazáním přijdeme o stopy, podle kterých zjistíme, co útočník na serveru dělal, a Petra přijde o svá data.~~ → **Smazáním přijdeš o stopy, co útočník dělal, a Petra o data. Účet radši zamkni a prověř.**
- ~~Účet zamknu, prověřím, co se v něm dělo, a s Petrou nastavím nové heslo.~~ → **Účet zamknu, prověřím a s Petrou nastavím nové heslo.** (správně)
- Nic, útočníka už blokuje firewall. → ~~Útočník zná Petřino heslo a z jiné adresy se může vrátit.~~ → **Firewall blokuje jen jednu adresu. Útočník zná Petřino heslo a může přijít odjinud.**

Krok 3 ze 3, Ať se to neopakuje: **Účet je zamčený. Vyber dva štíty, které na serveru nasadíš.** U tlačítka **Vybráno {n}/2**, tlačítko „Nasadit štíty“. Třetí výběr nejde: **Vybrat jde jen dva štíty. Nejdřív jeden odeber.** Podtexty, které prozrazovaly odpověď, jsou pryč.
- Přihlašování digitálním klíčem místo hesla (správně)
- Vypínat server přes noc → ~~Vypínat server nejde, objednávky z kaváren chodí i brzy ráno a útok může přijít kdykoli.~~ → **Objednávky chodí brzy ráno, pekárna by přišla o zákazníky. A útok může přijít i ve dne.**
- ~~Hlídač fail2ban: Po 5 neúspěšných pokusech útočníka sám zablokuje.~~ → **Automaticky blokovat po 5 chybných pokusech**, podtext **nástroj fail2ban** (správně)
- Přejmenovat server → ~~Přejmenování nepomůže, útočníci hledají otevřené porty a jméno serveru je nezajímá.~~ → **Útočník útočí na adresu, ne na jméno. Přejmenování nic nezmění.**

Chyba ve všech krocích: vysvětlení pod špatnou volbou, tlačítko **Zkusit znovu**, při první chybě **Hvězda za rozhodnutí napoprvé je pryč, hra ale pokračuje.**

Výsledková karta v herním boxu (místo pruhu „Hotovo, server je ubráněný!“ a hvězd s odrážkami): Tereza **Díky, jdu zpátky k pecím. Objednávky jedou dál.**, nadpis **Server je v bezpečí**, hvězdy a **{n}/3**, **Zásah za {time}**, **Pod 1 minutu to zvládne jen každý třetí.**, dovednosti **Čtení logů**, **Firewall**, **Správa účtů**, **SSH klíče**, věta **Přesně tohle dělají IT administrátoři každý den. A přesně tohle se naučíš v kurzu.**, tlačítka **Co dál?**, **Zahrát znovu**, **Sdílet výsledek**.

Sdílení: **Server pekárny Kvásek je v bezpečí. Hvězdy {n}/3, čas zásahu {time}. Zvládneš to rychleji?** a odkaz na ukázku, po zkopírování **Odkaz je zkopírovaný.**

Zmizí: ~~Přesně tohle se učí IT administrátoři: Linux, sítě a zabezpečení serverů.~~, ~~Server ubráněný~~, ~~Všechna rozhodnutí napoprvé~~, ~~Rozhodnutí napoprvé: {n} ze 3~~, ~~Zásah do 2 minut ({time})~~, ~~Vyber přesně dva štíty.~~, ~~Zkus to ještě jednou.~~ a pruh ~~Hotovo, server je ubráněný!~~ U IT admina se neukazuje ani „Můj výsledek“ v hlavičce.

## Výsledek (jeden sloupec)

Pořadí shora:
1. Doporučení: „Tvůj nejsilnější směr“ nebo „Tvoje první práce na zkoušku“, název oboru a jedna věta o kurzu (beze změny).
2. Cena s příspěvkem (beze změny, včetně zaškrtávátka pro nízký příjem a „Jak příspěvek funguje“).
3. Co dál: text, hlavní tlačítko, Detail kurzu a konzultace. Nově pod tlačítky: **Odkazy se otevřou v nové záložce, tvůj výsledek tady zůstane.**
4. **Zkus si další příklady**: ostatní ukázky, hotové odškrtnuté (~~Další práce na zkoušku~~).

Zmizí: seznam důvodů („Detektivka vyřešená na první pokus“, „Čas: 3 min“…), odznaky, „Bavilo tě to?“, „Co od kurzu čekáš?“ a podle otázky 1 i školení přes firmu.

- Prázdný výsledek: ~~Zatím nemáš žádný odznak~~ → **Zatím nemáš hotovou žádnou ukázku**
- Varianta 1b, jeden řádek v „Co dál“: **Chceš školení přes zaměstnavatele?** [Víc o školení pro firmy]

## Jen pro obchod (poznámka v Pipedrivu, na obrazovce není)

- ~~Detektivka vyřešená na první pokus~~ → **Všechny kroky správně napoprvé**
- ~~Detektivka vyřešená na {tries}. pokus~~ → **Špatné odpovědi po cestě: {n}**
- ~~Prozkoumané pohledy na data: {seen} ze 4~~ → zmizí
- První věta do telefonu: ~~Vidím, že máte za sebou datovou detektivku{firstTry}.~~ → **Vidím, že máte za sebou ukázku s daty kavárny{firstTry}.** Co vás na práci s daty bavilo?
