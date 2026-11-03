/* Tři malé aplikace, které „postaví“ AI. Každé postavení dostane nový stav,
   aby se úpravy z minulé aplikace nepřenášely do další (A14). */
import cs from '../content/cs.json';
import { BUSY, TIMES } from '../content/fixtures.ts';
import { fill, kc, plural } from '../logic/text.ts';
import type { IdeaKey } from '../logic/types.ts';
import { $, $$, esc } from '../ui/dom.ts';

export type AppOpts = Partial<Record<string, boolean>>;
export interface App {
  render(el: HTMLElement, o: AppOpts): void;
}

function uctenka(): App {
  const a = cs.ai.apps.uctenka;
  const st = { sum: 1840, people: 4, tip: 0 };
  return {
    render(el, o) {
      el.innerHTML = '<p class="app-title">' + a.title + '</p>' +
        '<div class="app-row"><label for="ap-sum">' + a.sum + '<input class="app-in" id="ap-sum" type="number" min="0" inputmode="numeric" value="' + st.sum + '"></label>' +
        '<label for="ap-people">' + a.people + '<input class="app-in" id="ap-people" type="number" min="1" inputmode="numeric" value="' + st.people + '"></label></div>' +
        (o.tip ? '<div class="app-row" role="group" aria-label="' + a.tipLabel + '">' + [0, 5, 10].map(t => '<button type="button" class="app-btn' + (st.tip === t ? ' on' : '') + '" data-tip="' + t + '">' + fill(a.tip, { tip: t }) + '</button>').join('') + '</div>' : '') +
        '<p class="app-big" id="ap-out"></p><p class="app-note" id="ap-note"></p>';
      const upd = () => {
        const total = st.sum * (1 + st.tip / 100);
        let per = st.people > 0 ? total / st.people : 0;
        per = o.round ? Math.ceil(per / 10) * 10 : Math.round(per);
        $(el, '#ap-out').textContent = fill(a.each, { amount: kc(per) });
        const sum = kc(Math.round(total));
        $(el, '#ap-note').textContent = (o.round ? a.rounded + ' ' : '') + (st.tip ? fill(a.totalTip, { total: sum, tip: st.tip }) : fill(a.total, { total: sum }));
      };
      $<HTMLInputElement>(el, '#ap-sum').addEventListener('input', e => { st.sum = Math.max(0, Number((e.target as HTMLInputElement).value) || 0); upd(); });
      $<HTMLInputElement>(el, '#ap-people').addEventListener('input', e => { st.people = Math.max(0, Math.floor(Number((e.target as HTMLInputElement).value) || 0)); upd(); });
      $$(el, '[data-tip]').forEach(b => b.addEventListener('click', () => {
        st.tip = Number(b.dataset.tip);
        $$(el, '[data-tip]').forEach(x => x.classList.toggle('on', x === b));
        upd();
      }));
      upd();
    },
  };
}

function kadernice(days: string[]): App {
  const a = cs.ai.apps.kadernice;
  const serv = a.services as [string, number][];
  const st = { day: 1, time: null as string | null, service: 0, booked: false };
  const render = (el: HTMLElement, o: AppOpts): void => {
    const busy = o.busy ? (BUSY[st.day] ?? []) : [];
    if (st.time && busy.includes(st.time)) st.time = null;
    el.innerHTML = '<p class="app-title">' + a.title + '</p>' +
      '<div class="app-row" role="group" aria-label="' + a.dayLabel + '">' + days.map((d, i) => '<button type="button" class="app-btn' + (st.day === i ? ' on' : '') + '" data-day="' + i + '">' + d + '</button>').join('') + '</div>' +
      (o.service ? '<div class="app-row" role="group" aria-label="' + a.serviceLabel + '">' + serv.map(([name, price], i) => '<button type="button" class="app-btn' + (st.service === i ? ' on' : '') + '" data-serv="' + i + '">' + name + ' ' + kc(price) + '</button>').join('') + '</div>' : '') +
      '<div class="app-row" role="group" aria-label="' + a.timeLabel + '">' + TIMES.map(t => '<button type="button" class="app-btn' + (st.time === t ? ' on' : '') + '" data-time="' + t + '"' + (busy.includes(t) ? ' disabled title="' + a.busy + '"' : '') + '>' + t + '</button>').join('') + '</div>' +
      '<div class="app-row"><button type="button" class="app-btn on" id="ap-book">' + a.book + '</button></div>' +
      '<p class="app-note" id="ap-conf"></p>';
    const [sName, sPrice] = serv[st.service]!;
    const what = o.service ? fill(a.what, { service: sName, price: kc(sPrice) }) : '';
    const vars = { den: days[st.day]!, cas: st.time ?? '', what };
    $(el, '#ap-conf').textContent = st.booked && st.time ? fill(a.booked, vars) : st.time ? fill(a.picked, vars) : o.busy ? a.busyHint : a.pickTime;
    $$(el, '[data-day]').forEach(b => b.addEventListener('click', () => { st.day = Number(b.dataset.day); st.time = null; st.booked = false; render(el, o); }));
    $$(el, '[data-serv]').forEach(b => b.addEventListener('click', () => { st.service = Number(b.dataset.serv); st.booked = false; render(el, o); }));
    $$(el, '[data-time]').forEach(b => b.addEventListener('click', () => { st.time = b.dataset.time ?? null; st.booked = false; render(el, o); }));
    $(el, '#ap-book').addEventListener('click', () => { if (st.time) st.booked = true; render(el, o); });
  };
  return { render };
}

function navyky(): App {
  const a = cs.ai.apps.navyky;
  const st = { habits: [...a.habits], grid: [[1, 1, 0, 1, 1, 1, 0], [1, 0, 1, 1, 0, 1, 1], [0, 1, 1, 1, 0, 0, 1]] };
  const longest = (row: number[]) => {
    let best = 0, cur = 0;
    for (const v of row) { cur = v ? cur + 1 : 0; best = Math.max(best, cur); }
    return best;
  };
  const render = (el: HTMLElement, o: AppOpts): void => {
    const done = st.grid.flat().filter(Boolean).length;
    let h = '<p class="app-title">' + a.title + '</p><div class="hgrid"><span></span>' + a.week.map(d => '<span class="hd">' + d + '</span>').join('');
    st.habits.forEach((name, r) => {
      const n = longest(st.grid[r]!);
      h += '<span class="hname" title="' + esc(name) + '">' + esc(name) + (o.streak ? '<small>' + fill(a.streak, { n, word: plural(n, a.streakWord) }) + '</small>' : '') + '</span>';
      st.grid[r]!.forEach((v, c) => {
        h += '<button type="button" class="hcell' + (v ? ' on' : '') + '" data-r="' + r + '" data-c="' + c + '" aria-pressed="' + (v ? 'true' : 'false') + '" aria-label="' + esc(fill(a.cell, { habit: name, day: a.week[c]! })) + '"></button>';
      });
    });
    h += '</div><p class="app-note" style="margin-top:12px">' + fill(a.progress, { done, total: st.habits.length * 7 }) + '</p>';
    if (o.add) h += '<div class="app-row" style="margin-top:10px"><input class="app-in" id="ap-new" type="text" placeholder="' + a.newHabit + '" style="width:12em" maxlength="40"><button type="button" class="app-btn on" id="ap-add">' + a.add + '</button></div>';
    el.innerHTML = h;
    $$(el, '.hcell').forEach(b => b.addEventListener('click', () => {
      const row = st.grid[Number(b.dataset.r)]!, c = Number(b.dataset.c);
      row[c] = row[c] ? 0 : 1;
      render(el, o);
    }));
    el.querySelector('#ap-add')?.addEventListener('click', () => {
      const v = $<HTMLInputElement>(el, '#ap-new').value.trim();
      if (!v || st.habits.length >= 6) return;
      st.habits.push(v);
      st.grid.push([0, 0, 0, 0, 0, 0, 0]);
      render(el, o);
    });
  };
  return { render };
}

export function createApp(idea: IdeaKey, days: string[]): App {
  if (idea === 'uctenka') return uctenka();
  if (idea === 'kadernice') return kadernice(days);
  return navyky();
}
