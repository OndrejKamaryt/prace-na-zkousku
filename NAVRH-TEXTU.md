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

- Podnadpis: ~~Čtyři pětiminutové ukázky skutečné práce.~~ → **Tři pětiminutové ukázky skutečné práce.** Stačí zkusit jednu a hned uvidíš, co ti sedí.
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

## Tvorba her (schváleno 5. 11., koncept v `prototyp/hra-koncept.html`)

Nadpis zůstává: „Zahraj si hru a pak ji uprav“

Podnadpis: **Běžíš z Coders Labu do svého prvního herního studia. Postavička běží sama, ty jen skáčeš. Sbírej kód a vyhýbej se bugům.**

Na začátku: **Zmáčkni Hrát a pak klepni kamkoli do hry.**

Cedule ve hře: CODERS LAB, HERNÍ STUDIO. Přehled na plátně: životy, kód, body a rekord {n}.

Nástroje:
- **Přidej plošinu:** Postava po ní běží a dá se na ni vyskočit.
- **Přidej bug:** Když se ho postava dotkne, přijde o život. Těžší hra, víc bodů.
- **Přidej kód:** Je to odměna, každý kousek je 100 bodů.
- **Přidej trampolínu:** Vystřelí postavu vysoko nad bugy.
- **Smazat:** Klepni na věc ve hře a zmizí.

Pády: **Au, bug! Přišla o život.** Postavička narazila do zdi. Spadla do díry. Zmáčkni Hrát znovu a zkus to ještě jednou.

Po třetím pádu: **Životy došly, ale nevadí, i herní designéři ladí obtížnost. Uprav hru, aby šla projít, třeba zasyp díru plošinou.**

Moc pádů ve vlastní verzi: **Je to moc těžké? Herní designér obtížnost ladí, zkus bug posunout nebo přidat plošinu.**

První výhra: **Máš to! Zkus to znovu na tři hvězdy, nebo hru uprav. Teď ji navrhuješ ty.** Karta: Jsi ve studiu!

Vlastní verze: **Tvoje verze hry je dohraná! Každý bug navíc je 50 bodů, zkus ji udělat těžší.** Karta: Tvoje hra je dohraná!

Karta dál: hvězdy, {n} bodů, Nový rekord! nebo Rekord: {n}

Hvězdy: Cíl, Všechen kód, Bez ztráty života, Těžká verze: aspoň 3 bugy. Třetí je „Bez ztráty života“ v původní hře a „Těžká verze: aspoň 3 bugy“ ve vlastní verzi.

Výzvy herního designéra {n}/{total}: Přidej bug, Přidej kód, Přidej trampolínu, Dohraj svou verzi

Pruh: **Hotovo, tvoje verze hry je dohraná! V Unreal Enginu 5 se stejně skládají celé herní světy, ve 3D a bez programování.**

## IT administrátor (schváleno 5. 11., koncept v `prototyp/admin-koncept.html`)

Nadpis: **Někdo se dobývá do serveru Coders Labu**

Podnadpis: **Máš noční službu. Na serveru běží přihlášky na kurzy a útočník zkouší hesla. Čím rychleji a přesněji zasáhneš, tím víc hvězd získáš. Všechno uděláš tlačítky, nic psát nemusíš.**

Přehled nahoře: Zabezpečení serveru, Čas zásahu, Pokusy útočníka. Mapa útoku: útočník, zablokováno.

Tereza, provoz Coders Labu, začátek: **Promiň, že budím. Od 3:00 se někdo pořád dokola pokouší přihlásit na server s přihláškami. Mrkneš na to?**

Krok 1, Najdi útočníka: Server si zapisuje každý pokus o přihlášení. Podívej se na ty, které neprošly. Tlačítko „Ukázat neúspěšná přihlášení“. Tereza: **Všechny jdou z jedné adresy a zkouší různá jména: root, admin, petra. Spočítej, kolik pokusů přišlo odkud.** Tlačítko „Spočítat pokusy podle adresy“. **Klikni na adresu útočníka.**
- 198.51.100.23 → Tereza: Tři pokusy? To je nejspíš někdo z kanceláře, kdo si spletl heslo.
- 192.0.2.10 → Tereza: Jeden neúspěšný pokus je běžný překlep.

Krok 2, Zavři dveře: **Správně! Tolik pokusů za pár minut nezkouší člověk, ale program, který hádá hesla. Zablokuj ho.** Tlačítko „Zablokovat adresu útočníka“. **Útočník je venku, útoky se odrážejí. Jen zkontroluj, jestli se mezitím nedostal dovnitř.** Tlačítko „Ukázat, kdo se přihlásil“. **Ve 3:12 se z adresy útočníka přihlásila lektorka Petra. Jenže ve tři ráno Petra spí. Co uděláš s jejím účtem?**
- Účet smažu i se všemi daty. → Tereza: Smazáním přijdeme o stopy, podle kterých zjistíme, co útočník na serveru dělal, a Petra přijde o svá data.
- Účet zamknu, prověřím, co se v něm dělo, a s Petrou nastavím nové heslo. (správně)
- Nic, útočníka už blokuje firewall. → Tereza: Útočník zná Petřino heslo a z jiné adresy se může vrátit.

Krok 3, Ať se to neopakuje: **Účet je zamčený. Vyber dva štíty, které na serveru nasadíš.** Tlačítko „Nasadit štíty“.
- Přihlašování digitálním klíčem místo hesla: Klíč se uhodnout nedá. (správně)
- Vypínat server přes noc: Přihlášky chodí i v noci. → Tereza: Vypínat server nejde, přihlášky chodí i v noci a útok může přijít kdykoli.
- Hlídač fail2ban: Po 5 neúspěšných pokusech útočníka sám zablokuje. (správně)
- Přejmenovat server: Aby ho útočník nenašel. → Tereza: Přejmenování nepomůže, útočníci hledají otevřené porty a jméno serveru je nezajímá.

Konec: **Server je v bezpečí**, Tereza: **Díky, jdu zase spát. Přihlášky jedou dál.** Hvězdy: Server ubráněný, Všechna rozhodnutí napoprvé, Rozhodnutí napoprvé: {n} ze 3, Zásah do 2 minut ({time}). Přesně tohle se učí IT administrátoři: Linux, sítě a zabezpečení serverů.

Pruh: **Hotovo, server je ubráněný!**

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
