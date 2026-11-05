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

## Datová analýza: klikačka po třech krocích

Nadpis zůstává: „Proč kavárně Zrnko v březnu klesly tržby?“

Zadání: ~~Majitelka Jana nechápe, kam se v březnu ztratilo 57 600 Kč. Přepínej pohledy na data a najdi viníka.~~ → **Majitelka kavárny Jana vidí, že v březnu vydělala méně než jindy. Najdi, proč poklesly tržby. Půjdeš na to ve třech krocích, stejně jako datový analytik.**

Zmizí: tip, záložky s pohledy, pohled podle hodin, průměrná útrata a počet účtenek, otázka se čtyřmi odpověďmi, „Prohlédnuto n ze 4 pohledů“, tlačítko „Znám viníka“. Graf má u každého pruhu jeho částku, bez rozdílu proti únoru. Legenda: ~~březen a rozdíl proti únoru~~ → **březen**.

Na obrazovce je vždy jen jeden krok. Po dvou špatných odpovědích se správná ukáže sama.

**Krok 1 ze 3: Porovnej měsíce**
- Text: **Analytik začíná tím nejjednodušším: kolik kavárna vydělala za každý měsíc.**
- Graf: tržby leden až duben (jako dnes).
- Otázka: **Ve kterém měsíci tržby klesly?** Volby: Leden, Únor, Březen, Duben.
- Špatně: **V tomhle měsíci vydělala kavárna zhruba jako jindy. Hledej nejkratší pruh.**
- Správně: **Správně, v březnu kavárna vydělala o 57 600 Kč méně než v únoru. Teď zjistíme proč.**
- Tlačítko: **Další krok**

**Krok 2 ze 3: Podívej se, co lidé kupovali**
- Text: **Tržby za únor a březen teď rozdělíme podle toho, co lidé kupovali.**
- Graf: únor a březen podle produktů.
- Otázka: **Co se v březnu prodávalo mnohem méně?** Volby: Káva a nápoje, Dezerty, Snídaně, Obědové menu.
- Špatně: **Tady je březen skoro stejný jako únor. Hledej, kde je březnový pruh mnohem kratší.**
- Správně: **Přesně tak. Snídaně spadly z 62 100 na 9 300 Kč, ostatní se prodávalo skoro stejně. Zbývá zjistit, kdy snídaně chyběly.**
- Tlačítko: **Další krok**

**Krok 3 ze 3: Podívej se na dny v týdnu**
- Text: **Stejné tržby teď rozdělíme podle dnů v týdnu.**
- Graf: únor a březen podle dnů.
- Otázka: **Kdy kavárna v březnu vydělala méně?** Volby: **Ve všední dny**, **O víkendu**, **Každý den stejně**.
- Špatně (všední dny): **Od pondělí do pátku je březen skoro stejný jako únor. Podívej se na sobotu a neděli.**
- Špatně (každý den): **Kdyby to bylo každý den, byly by kratší všechny březnové pruhy. Podívej se na sobotu a neděli.**

Po dvou špatných: **Správná odpověď je označená zeleně.**

**Výsledek ukázky**
- Nadpis: **Zmizely víkendové snídaně**
- Text: **Snídaně se v březnu skoro neprodávaly a chyběly hlavně o víkendu. Majitelka pak potvrdila, že v březnu odešel kuchař a o víkendu snídaně nikdo nepřipravoval. Stálo ji to 52 800 Kč za měsíc.**
- **Přesně tohle dělá datový analytik: z čísel zjistí, co se ve firmě děje, a pomůže rozhodnout, co s tím.**
- Rozbalovací „Jak na to přijde datový analytik“ s ukázkou SQL zůstává.
- Pruh: ~~Hotovo, detektivka je vyřešená!~~ → **Hotovo, víš, proč tržby klesly!**

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

- ~~Detektivka vyřešená na první pokus~~ → **Všechny tři kroky správně napoprvé**
- ~~Detektivka vyřešená na {tries}. pokus~~ → **Špatné odpovědi po cestě: {n}**
- ~~Prozkoumané pohledy na data: {seen} ze 4~~ → zmizí
- První věta do telefonu: ~~Vidím, že máte za sebou datovou detektivku{firstTry}.~~ → **Vidím, že máte za sebou ukázku s daty kavárny{firstTry}.** Co vás na práci s daty bavilo?
