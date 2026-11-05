# Zpětná vazba ze 4. 11. 2026 a zadání zjednodušení

Zdroj: schůzka Ondřeje s Martinem Ptáčkem „Marketing a lead magnety“ 4. 11. 2026 (záznam ve Wispr Flow, přepis přečtený celý). Tohle je zadání pro další práci a má přednost před fází 4 z `PREDANI.md`. Z ostatních témat schůzky (marketing, reklamy, kancelář) sem nepatří nic.

## Rozhodnuto

1. **Odznaky vypadávají.** Žádný pruh s odznaky, žádné vyzvednutí odznaku, žádné okno s odznakem a konfetami, žádné „Odznaky n/4“ v hlavičce.
2. **Výsledková stránka bude v jednom sloupci** a zjednodušená.
3. **Stavění s AI se schová** (Ondřej, 4. 11.). Na kurz agentního programování je moc jednoduchá a vstupní kurz AI zatím není. Kód nemazat, jen ji nikde nenabízet (úvod, další příklady, doporučení, `?ukazka=ai`), aby šla vrátit, až kurz vznikne.
4. **Po krocích:** udělat jednoduchou verzi, nasadit a změřit, jestli přináší leady. Nic navíc.
5. **Distribuce:** mikrostránka v menu webu a bannery na stránkách kurzů, které vedou rovnou na jednu ukázku (`?ukazka=data`, `?ukazka=kyber`, `?ukazka=hry`). Martin vloží adresu z GitHub Pages na web přes embed na celou obrazovku, takže hlavní je samostatná stránka (`data-variant="standalone"`).
6. **Zvuky ne.** Lidé budou hrát hlavně na mobilu, často v MHD.

## Co změnit

### Celý nástroj

- Na obrazovce ukázky dát místo „Zpět na výběr“ dole „Zkus si další příklady“: ostatní ukázky, hotové odškrtnuté. Člověk může přijít z jakéhokoli banneru a pokračovat dál.
- Po dokončení ukázky místo vyzvednutí odznaku rovnou cesta k výsledku a k dalším příkladům.
- Texty pro úplné začátečníky („pro babičku“), bez žargonu jako level nebo viník.
- Princip od Martina: dokonalost je, když už není co odebrat. Na obrazovce jen to, co je nezbytně nutné, jinak jsou lidé zmatení.

### Výsledková stránka

- Jeden sloupec. Zůstává hlavně dnešní pravá část: cena s příspěvkem a „Co dál“.
- Dnes je přeplácaná: bije se modrá, žlutá, bílá a černá a honí moc zajíců najednou (bavilo tě to, co od kurzu čekáš, školení přes firmu, další práce).
- „Bavilo tě to“ a „Co od kurzu čekáš“ vypadají jako tlačítka, ale jsou to přepínače, takže není jasné, kam kliknout. Buď z nich udělat zjevné přepínače nebo zaškrtávátka, nebo je vyřadit. S odznaky stejně padá sekce v dnešní podobě.
- U „Detail kurzu“ musí být jasné, co se stane. Martin se bál, že odejde a výsledek se mu vynuluje.

### Datová analýza

- Dnes je moc těžká. Grafy podle produktů a dnů jsou odvozená data (rozdíl únor proti březnu) a část lidí nepozná, co se stalo ani co znamenají částky.
- Předělat na klikačku po krocích jako Stavění s AI: porovnej měsíce, pak produkty, pak dny, a výsledek „zmizely víkendové snídaně“. Nápověda formou interaktivních kroků s volbami, ne tlačítkem „Napověz mi“.
- Zadání přesně: „Najdi, proč poklesly tržby.“ Ne „najdi viníka“ ani „kam se v březnu ztratilo 57 600 Kč“, to zní jako krádež a lidé hledají zloděje.
- Cíl ukázky není, aby ji člověk vyřešil, ale aby viděl, co datový analytik dělá, a oddělil si obory od sebe.

### Kyberbezpečnost

- Líbí se, obsah zůstává.
- Jeden levý sloupec shora dolů: přečti text, klikni, přečti, klikni. Tlačítka akcí pod text, ne vpravo. Poplach má přímo navazovat na akce.
- Výpis terminálu je jen ilustrace a patří bokem, člověk mu stejně nerozumí.
- Po vyřešení „Server je v bezpečí“ a další krok taky pod text vlevo, ať člověk jede dál v tom, v čem začal.
- Kurz kyberbezpečnosti má být od ledna.

### Tvorba her

- Líbí se („vtipné“), pulzující „Hrát“ Martin viděl.
- Hra (plátno) přes celou šířku rámečku.
- Nástroje editoru s nakreslenými ikonami (plošina jako blok s modrým vrškem, bodce, mince) a krátkým vysvětlením pro začátečníka, například:
  - Přidej plošinu
  - Přidej nástrahu: když se jí postava dotkne, přijde o život
  - Přidej mince: jsou odměna a sbíráš za ně body
  - Smazat (dnes „Guma“), oddělené od objektů
- Texty bez slova level: třeba „Zahraj si hru a pak ji uprav“ místo „Zahraj si level a pak ho postav po svém“, i „Výchozí level“ říct jednodušeji.

## Otevřené otázky (Ondřej rozhodl 5. 11., platí doporučené varianty)

Výsledek má doporučený obor s jednou větou, cenu s příspěvkem, „Co dál“ a další příklady, ostatní je pryč včetně školení přes firmu. Konec ukázky je pruh „Hotovo“ s „Můj výsledek“ a pod ním „Zkus si další příklady“. V hlavičce je „Můj výsledek“ až po první hotové nebo přeskočené ukázce. „Hotovo“ dál znamená dokončenou ukázku, stav, snímek a hodnocení zůstávají, odpovědi na bavilo, cíl a firmu jsou prázdné. Věta o kurzu kyberbezpečnosti od ledna se nepřidává. Schválené texty jsou v `NAVRH-TEXTU.md`, podrobnosti v `PREDANI.md`. Původní znění otázek:

- **Texty:** všechny nové texty schvaluje Ondřej (`CLAUDE.md`). Připravit návrh pro data, hru, výsledek a další příklady najednou.
- **Výsledek:** co přesně zůstane (doporučení a proč, cena, „Co dál“, školení přes firmu, nízký příjem) a co jde pryč.
- **Konec ukázky:** rovnou výsledek, nebo lišta s „Můj výsledek“ a „Zkus si další příklady“?
- **Úvod:** zůstává jako rozcestník mikrostránky se třemi kartami? Co z něj zmizí s odznaky.
- **Data pro fázi 4:** co znamená „hotovo“ bez odznaku ve stavu, snímku pro Pipedrive (`snapshot`, `badgeCount`) a hodnocení.

## Co se nemění

- Pravidla z `CLAUDE.md`: texty, typografie, vzhled, žádný kontaktní formulář, nesahat na `location.hash`, nic do Pipedrivu.
- Varianta embed a měření hlavičky zůstávají funkční, i když teď jde hlavně o samostatnou stránku.
- Testy upravit, ne mazat bez náhrady. Hotovo je, když unit i Playwright testy prochází, typecheck a build jsou čisté, je to ověřené na 390 × 844 i 1366 × 768 a demo na GitHub Pages ukazuje novou verzi.

## Mimo kód

- Ondřej pošle Martinovi adresu https://ondrejkamaryt.github.io/prace-na-zkousku/. Po zjednodušení zůstane stejná.
