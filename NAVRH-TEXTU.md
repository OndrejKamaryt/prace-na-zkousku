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

Rozbalovací „Jak na to přijde datový analytik“: **Každý tvůj klik byl jeden dotaz. V databázi je píše v jazyce SQL, v Excelu mu stačí kontingenční tabulka.** Ukázka SQL. Nemusíš tomu teď rozumět, na kurzu se to naučíš od nuly.

Pruh: **Hotovo, víš, proč tržby klesly!**

## Tvorba her

- Nadpis: ~~Zahraj si level a pak ho postav po svém~~ → **Zahraj si hru a pak ji uprav**
- Kroky: Zahraj si, ~~Uprav level~~ → **Uprav hru**, ~~Dohraj svůj level~~ → **Dohraj svou verzi**
- Popisek nástrojů: ~~Dílky~~ → **Nástroje**
- Nástroje s nakreslenou ikonou (blok s modrým vrškem, růžové bodce, mince, guma) a vysvětlením. Smazat je oddělené od ostatních.
  - ~~Plošina~~ → **Přidej plošinu**: **Postava po ní běží a dá se na ni vyskočit.**
  - ~~Bodce~~ → **Přidej nástrahu**: **Když se jí postava dotkne, přijde o život.**
  - ~~Mince~~ → **Přidej mince**: **Jsou odměna, sbíráš za ně body.**
  - ~~Guma~~ → **Smazat**: **Klepni na věc ve hře a zmizí.**
- Popis plátna pro čtečky: ~~Herní level. Ve hře klepnutím skáčeš, při úpravách klepnutím pokládáš dílky.~~ → **Hra. Při hraní klepnutím skáčeš, při úpravách klepnutím přidáváš věci do hry.**
- ~~Upravit level~~ → **Upravit hru**
- ~~Výchozí level~~ → **Vrátit původní hru**
- Odemčení úprav: ~~…Uprav level, aby šel projít, třeba zasyp díru plošinou.~~ → **Nevadí, i herní designéři ladí obtížnost. Uprav hru, aby šla projít, třeba zasyp díru plošinou.**
- Moc těžké: ~~Je to moc těžké? Dobrý level designér obtížnost ladí, zkus překážku posunout nebo přidat plošinu.~~ → **Je to moc těžké? Herní designér obtížnost ladí, zkus nástrahu posunout nebo přidat plošinu.**
- První výhra: ~~…Teď level navrhuješ ty: přidej bodce, mince nebo plošiny a zmáčkni Hrát.~~ → **Super, máš to! Mince: {coins}. Teď hru navrhuješ ty: přidej nástrahy, mince nebo plošiny a zmáčkni Hrát.**
- Vlastní výhra: ~~Tvůj vlastní level je dohraný! Mince: {coins}. Zkus ho udělat ještě těžší.~~ → **Tvoje verze hry je dohraná! Mince: {coins}. Zkus ji udělat ještě těžší.**
- Výhra bez úprav: ~~Dohráno! Mince: {coins}. Teď level uprav po svém a zkus ho znovu.~~ → **Dohráno! Mince: {coins}. Teď hru uprav po svém a zkus ji znovu.**
- Nápověda k úpravám: ~~Klepni do mřížky a polož dílek. Až budeš chtít, zmáčkni Hrát.~~ → **Vyber, co chceš přidat, a klepni do hry. Až budeš chtít, zmáčkni Hrát.**
- Start a cíl: ~~Tohle pole patří startu nebo cíli, polož dílek jinam.~~ → **Tady je start nebo cíl, polož to jinam.**
- Po vrácení: ~~Level je zase ve výchozí podobě.~~ → **Hra je zase v původní podobě.**
- Počítadlo: ~~Pokusy: {plays}, upravené dílky: {edits}~~ → **Pokusy: {plays}, úpravy: {edits}**
- Pruh: ~~Hotovo, tvůj level je dohraný! V Unreal Enginu 5…~~ → **Hotovo, tvoje verze hry je dohraná! V Unreal Enginu 5 se stejně skládají celé herní světy, ve 3D a bez programování.**

Plátno roztáhnu na celou šířku rámečku. Herní plocha i fyzika zůstanou stejné, po stranách bude pokračovat obloha a zem. Výška zůstane taková, aby šlo hrát bez scrollování.

## Kyberbezpečnost

Texty beze změny. Jeden levý sloupec shora dolů: zadání, poplach, hned pod ním krok s tlačítky, po vyřešení „Server je v bezpečí“ a tlačítko Můj výsledek. Terminál vpravo jako ilustrace, na mobilu pod krokem.

- Pruh: ~~Hotovo, server je v bezpečí!~~ → jen tlačítko **Můj výsledek**, protože „Server je v bezpečí“ je hned nad ním.

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
