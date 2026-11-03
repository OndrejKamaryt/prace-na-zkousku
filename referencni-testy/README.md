# Referenční testy prototypu

Python Playwright skripty, kterými byl testován `../prototyp/prace-na-zkousku.html`. Pro nový projekt je přepiš do testů v TypeScriptu. Popisují toky a hraniční případy, které musí fungovat i ve widgetu.

Spuštění proti prototypu: `python3 check7.py "$(pwd)/../prototyp/prace-na-zkousku.html"`

- `check7.py`: celé toky Datová analýza, Stavění s AI a Kyberbezpečnost, okno s odznakem (fokus, Escape), výsledek, ceny, nízkopříjmová skupina, školení přes firmu, pořadí bloků na mobilu.
- `check6.py`: šířka stránky v Kyberbezpečnosti na mobilu, velikost plátna a viditelnost tlačítka Hrát na notebooku, prohození Skok a Hrát, plovoucí tlačítko „Znám viníka“, velikost políček v trackeru návyků.
- `gametest.py`: hra se po pádu sama nespouští, po třech pádech se odemkne editor, vlastní level jde dohrát.
- `hiddencheck.py`: prvky s atributem `hidden` opravdu nejsou vidět.

Prototyp přepíná obrazovky přes `location.hash`, widget to dělat nesmí. Navigaci v testech proto nahraď klikáním na tlačítka nebo atributem `data-start`.
