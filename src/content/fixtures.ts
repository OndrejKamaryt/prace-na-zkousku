/* Technické ukázky z prototypu: kód, dotaz SQL a výpisy terminálu. Nejsou to
   texty rozhraní (ty jsou v cs.json), ale přípravky, které ukázka jen
   vypisuje, a proto se na ně nevztahují typografická pravidla. Data v nich
   se počítají od dneška (rozhodnutí 19). */
import { ATTACKER, OFFICE, TYPO } from '../logic/kyber.ts';
import type { IdeaKey } from '../logic/types.ts';

export const SQL = "SELECT produkt, mesic, SUM(trzba) AS trzby\nFROM uctenky\nWHERE mesic IN ('únor', 'březen')\nGROUP BY produkt, mesic\nORDER BY produkt;";

/** Kód, který „píše“ AI. Rezervace dostane dny, které aplikace opravdu ukazuje. */
export function ideaCode(idea: IdeaKey, days: string[]): string[] {
  if (idea === 'uctenka') {
    return ['<label>Útrata <input id="castka" value="1840"></label>', '<label>Počet lidí <input id="lidi" value="3"></label>', '<p id="vysledek"></p>', '', '<script>', 'function spocitej() {', '  const castka = Number(castkaInput.value);', '  const lidi = Number(lidiInput.value);', '  const naOsobu = lidi > 0 ? castka / lidi : 0;', '  vysledek.textContent = `Každý platí ${naOsobu} Kč`;', '}', '</script>'];
  }
  if (idea === 'kadernice') {
    return ['const dny = [' + days.map(d => "'" + d + "'").join(', ') + '];', "const casy = ['9:00', '10:30', '13:00', '14:30', '16:00'];", '', 'function vyberTermin(den, cas) {', '  vybrano = { den, cas };', '  prekreslit();', '}', '', 'function rezervuj() {', '  potvrzeni.textContent = `Rezervováno: ${vybrano.den} v ${vybrano.cas}`;', '}'];
  }
  return ["const navyky = ['Posilovna', 'Učení 30 minut', 'Spát do 23:00'];", "const dny = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];", '', 'function prepni(navyk, den) {', '  splneno[navyk][den] = !splneno[navyk][den];', '  ulozit();', '  prekreslit();', '}', '', 'const celkem = splneno.flat().filter(Boolean).length;'];
}

/** Časy rezervací a obsazené termíny podle pořadí dne. */
export const TIMES = ['9:00', '10:30', '13:00', '14:30', '16:00'];
export const BUSY: Record<number, string[]> = { 0: ['10:30', '14:30'], 1: ['9:00', '16:00'], 2: ['13:00'] };

/** Tři nejbližší pracovní dny od zítřka, jako v rezervačním systému kadeřnictví. */
export function nextWorkdays(today: Date, count = 3): Date[] {
  const out: Date[] = [];
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d));
  }
  return out;
}

/* ---------- terminál serveru pekárny ---------- */
export const IP = ATTACKER;
export const PROMPT = 'admin@kvasek-srv:~$ ';
export const BANNER = '# server pekárny Kvásek, Ubuntu 24.04';

export type TermLine = [cls: 'o' | 'c' | 'bad', html: string];
export type CmdKey = 'grep' | 'count' | 'ufw' | 'last' | 'lock' | 'f2b' | 'keys' | 'restart';

const hl = (s: string) => '<span class="hl">' + s + '</span>';
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Datum jako ve výpisu příkazu last: „Tue Nov  3 03:12“. */
const lastDate = (d: Date, time: string) => DOW[d.getDay()] + ' ' + MON[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, ' ') + ' ' + time;

/** Počet pokusů ve výpisu uniq -c, zarovnaný doprava jako v terminálu. */
const uniq = (n: number, ip: string) => String(n).padStart(5, ' ') + '  ' + ip;

/** Výpisy příkazů. Počty pokusů podle adresy jdou ze stavu hry (Martinovo zadání UX-03). */
export function commands(today: Date, byIp: Record<string, number>): Record<CmdKey, { cmd: string; out: TermLine[] }> {
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  return {
    grep: { cmd: 'grep "Failed password" /var/log/auth.log | tail -n 4', out: [
      ['o', '03:11:52  Failed password for root from ' + hl(IP)],
      ['o', '03:11:55  Failed password for admin from ' + hl(IP)],
      ['o', '03:11:58  Failed password for petra from ' + hl(IP)],
      ['o', '03:12:01  Failed password for root from ' + hl(IP)]] },
    count: { cmd: "grep \"Failed password\" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c", out: [
      ['o', uniq(byIp[IP]!, hl(IP))], ['o', uniq(byIp[OFFICE]!, OFFICE)], ['o', uniq(byIp[TYPO]!, TYPO)]] },
    ufw: { cmd: 'sudo ufw insert 1 deny from ' + IP, out: [['o', 'Rule inserted']] },
    last: { cmd: 'last -i -n 3', out: [
      ['bad', 'petra   203.0.113.47    ' + lastDate(today, '03:12')],
      ['o', 'tomas   192.0.2.10      ' + lastDate(yesterday, '16:41')],
      ['o', 'petra   198.51.100.23   ' + lastDate(yesterday, '08:02')]] },
    lock: { cmd: 'sudo usermod -L petra', out: [['c', '# účet petra je zamčený, staré heslo už nefunguje']] },
    f2b: { cmd: 'sudo apt install -y fail2ban', out: [['o', 'Setting up fail2ban ...'], ['c', '# po 5 neúspěšných pokusech fail2ban adresu sám zablokuje']] },
    keys: { cmd: 'echo "PasswordAuthentication no" | sudo tee /etc/ssh/sshd_config.d/50-bez-hesel.conf', out: [['o', 'PasswordAuthentication no']] },
    restart: { cmd: 'sudo systemctl restart ssh', out: [['c', '# přihlásit se jde už jen klíčem, hádání hesel nemá smysl']] },
  };
}

/** Dotaz, který se vypíše nad grafem datové ukázky: každý klik analytika je jeden dotaz. */
export const SQL_CHART = {
  months: 'SELECT mesic, SUM(trzba) FROM uctenky GROUP BY mesic',
  days: 'SELECT den, mesic, SUM(trzba) FROM uctenky GROUP BY den, mesic',
  products: 'SELECT produkt, mesic, SUM(trzba) FROM uctenky GROUP BY produkt, mesic',
};

/** Řádky z pokladny, které se sypou při stahování dat: datum, položka, cena v Kč. */
export const RECEIPTS: [string, string, number][] = [
  ['2.\u00A03.', 'Snídaně', 189], ['2.\u00A03.', 'Cappuccino', 72], ['3.\u00A03.', 'Dort', 95], ['3.\u00A03.', 'Espresso', 58],
  ['4.\u00A03.', 'Polední menu', 165], ['5.\u00A03.', 'Flat white', 78], ['6.\u00A03.', 'Bábovka', 69], ['7.\u00A03.', 'Espresso', 58],
  ['8.\u00A03.', 'Limonáda', 64], ['9.\u00A03.', 'Cappuccino', 72], ['10.\u00A03.', 'Polední menu', 165], ['11.\u00A03.', 'Dort', 95],
];
