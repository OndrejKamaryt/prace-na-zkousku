# Jak zapisovat do B2C Pipedrivu (podklad pro fázi 5)

Ondřej 16. 11.: leady z Práce na zkoušku se mají zapisovat stejně jako ostatní B2C zájemci. Tady je, jak to dnes vypadá v Pipedrivu „Coders Lab CZ & SK“ (jen čtení 16. 11., zhruba 25 nejnovějších leadů a 65 dealů z pipeline Studenti od 5. 11., bez osobních údajů), a návrh, co z toho plyne. Do Pipedrivu se nic nezapsalo.

## Jak se dnes zapisují B2C zájemci

- **Webové formuláře a lead magnety zakládají rovnou deal**, ne lead. Pipeline Studenti (id 2), etapa New (id 14), `value` 0 CZK, `origin` API. Zapisuje integrace přes API pod uživatelem 20546268, vlastníka si pak přebírají obchodníci.
- **Leady v Leads Inboxu** jsou jen ruční záznamy a nativní formulář „Potvrzení konzultace“.
- **Název dealu:** `{e-mail} (Webform)`, kurz ani zdroj v názvu nejsou. Osoba se jmenuje stejně, má e-mail (label work) a telefon. Organizace se nezakládá, štítky ani poznámky se nepoužívají.
- **UTM do vlastních polí dealu:**

| Pole | Klíč |
|---|---|
| ad_campaign | `4dba554d17bf6a7517a52244f0f6ab344e9e18e2` |
| ad_source | `e29129325f1260c8cf9bbff02f54c31030ef5e3e` |
| ad_medium | `d3218202c78ddbd598a6cd68156d2a0216de0652` |
| ad_content | `fb5661b3c60d512be65e464d26543a07a58246de` |
| ad_term | `0c96b3b7a5f2bd34a62912bf5c61898fd30ac1ec` |

- **Dvě aktivity při vzniku dealu:**
  1. `type` email, hotová, předmět `Lead z webu ({conversion})`, například `webform_freeminicourse` (minikurz) nebo `webform_contractdata` (objednávka s dotací). V poznámce je `<b>New submission:</b><br><br>` a pak řádky `<b>klíč:</b> hodnota<br>` (campaign, content, conversion, email, link, medium, name, phone, source, term…).
  2. `type` call_attempt, nehotová, předmět `Call attempt #1`, termín další pracovní den, přiřazená obchodníkovi.
- **Talentový test** (starý lead magnet, který Práce na zkoušku nahrazuje) vlastní deal nezakládá. K dealu přidá třetí aktivitu: `type` call_attempt, hotová, předmět `Nové vyplnění talentového testu`, poznámka `<b>Nové vyplnění talentového testu:</b>` a řádky `<b>klíč:</b> hodnota<br>` s kontaktem, UTM (chybějící jako „N/A“) a skóre oborů `itadmin`, `analityk`, `backend`, `frontend`, `tester` (0 až 6).
- **Pole hodnocení oborů** na dealu (Data Analyst, IT Administrator a další, bad/average/great) zůstávají u nových dealů prázdná, talentový test je dnes neplní.

## Co z toho plyne pro Práci na zkoušku (návrh ke schválení)

Nejbližší vzor je talentový test, protože ho nástroj nahrazuje. Proti původnímu `ZADANI.md` (kapitola 4) by se zápis zjednodušil:

1. **Deal zakládá formulář, ne nástroj.** Kdo nechá kontakt, dostane deal standardní cestou: `{e-mail} (Webform)`, Studenti, New, UTM, aktivity `Lead z webu (webform_pracenazkousku)` a `Call attempt #1`. Kód `conversion` je návrh.
2. **Výsledky z nástroje jako jedna aktivita na dealu**, stejně jako talentový test: `type` call_attempt, hotová, předmět `Nové vyplnění Práce na zkoušku`, poznámka `<b>Nové vyplnění Práce na zkoušku:</b><br><br>` a řádky `<b>klíč:</b> hodnota<br>`: ukázky s hodnocením (`data`, `kyber`, `hry`: great, average, bad), doporučený směr, čas v nástroji, vstup (`?ukazka`), UTM a „Návrh první věty do telefonu“. Při dalším odeslání stejnou aktivitu aktualizovat, ne zakládat novou.
3. **Bez nových polí na dealu a bez poznámky.** B2C Pipedrive poznámky ani pole pro lead magnety nepoužívá. Hodnocení by šlo navíc zapsat do existujících polí Data Analyst a IT Administrator, pokud je obchod ve filtrech používá (ověřit).
4. **Vlastní úkol „Zavolat: Práce na zkoušku“ odpadá**, volání hlídá `Call attempt #1` od formuláře.

## Otevřené otázky

- **Odkud bude kontakt?** Nástroj kontakt nesbírá a podle schůzky 4. 11. lidé přijdou hlavně z bannerů na webu, tedy bez formuláře a bez tokenu `?pnz`. Takový návštěvník se do Pipedrivu nedostane vůbec. Možnosti:
  - formulář až po výsledku (například u „Co dál?“: minikurz, webinář, konzultace), který deal založí standardní cestou a výsledky z nástroje k němu přidá,
  - formulář před nástrojem s tokenem podle `ZADANI.md` (proti tomu mluví, že brání vyzkoušení),
  - jen analytika bez zápisu do Pipedrivu.
- **Kód `conversion`** a adresa příjemce formuláře (`email_to`) pro Práci na zkoušku.
- **Pole hodnocení oborů:** zapisovat do Data Analyst a IT Administrator, nebo jen do aktivity?
- **Integrace:** zápis teď dělá neznámý nástroj (Zapier, Make nebo vlastní skript) pod uživatelem 20546268. Má endpoint Práce na zkoušku zapisovat sám, nebo přes stejnou integraci?
