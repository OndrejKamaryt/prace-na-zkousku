# Práce na zkoušku: pravidla projektu

Zadání je v `ZADANI.md`, zdroj pravdy pro texty, chování a vzhled je `prototyp/prace-na-zkousku.html`.

## Texty
- Celé rozhraní je česky. Texty se přebírají z prototypu 1:1 a bez souhlasu se nemění.
- Nepoužívat dlouhou pomlčku (znak U+2014) ani tečky mezi slovy jako oddělovač (A · B). Text nesmí působit, jako by ho psala AI.
- Za jednopísmennými slovy k, s, v, z, o, u, a, i a mezi číslem a jednotkou (64 000 Kč, 5 minut, 80 %) je pevná mezera (U+00A0). Tisíce se oddělují pevnou mezerou.
- Žádné tvary typu „udělal(a)“. Odznaky mají neutrální názvy (Detektivka vyřešená, Aplikace postavená, Level dohraný, Server ubráněný).
- České uvozovky „takto“.

## Vzhled
Podle webu coderslab.cz, tokeny jsou v prototypu na `:root`:
- písmo Ubuntu (nadpisy, tlačítka, štítky) a Open Sans (text), ve hře a terminálu Ubuntu Mono,
- žlutá #FABA20, tmavá #212529, světle modrá #69CCEA, krémová #FCF3D9, tmavě modrá #17496F, růžová #D81B53, sekundární text #5F676F,
- tlačítka jako pilulky bez kapitálek, karty se zaoblením 6 px, panely 8 px,
- jen světlý vzhled, stejně jako web.

## Data
- Nástroj nesbírá kontakt. Žádný formulář na jméno, e-mail ani telefon.
- Pipedrive API token nikdy v kódu pro prohlížeč.
- Do skutečného Pipedrivu nezapisovat bez Ondřejova schválení, při vývoji `DRY_RUN=1`.
- Nesahat na `location.hash` ani na jiný stav hostitelské stránky.

## Než něco uděláš, zeptej se
- přidání runtime závislosti,
- změna textu nebo ceny,
- zápis do ostrého Pipedrivu nebo založení polí,
- cokoli z otevřených otázek v kapitole 9 zadání.
