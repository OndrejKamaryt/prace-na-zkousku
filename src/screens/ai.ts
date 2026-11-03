/* Stavění s AI: předem připravený agent a tři malé aplikace. Po postavení
   člověk najde chybu, kterou AI udělala, a nechá ji opravit. Teprve pak jdou
   úpravy a odznak je po první dokončené úpravě. Žádné pole pro vlastní pokyn. */
import cs from '../content/cs.json';
import { BUSY, ideaCode, nextWorkdays } from '../content/fixtures.ts';
import { changeApplied, ideaBuilt, startIdea } from '../logic/state.ts';
import { fill } from '../logic/text.ts';
import { NBSP } from '../logic/typography.ts';
import { IDEAS } from '../logic/types.ts';
import type { IdeaKey } from '../logic/types.ts';
import type { Ctx, Screen } from '../ui/ctx.ts';
import { $, $$, el } from '../ui/dom.ts';
import { claimBar, viewHead } from '../ui/parts.ts';
import { createApp } from './ai-apps.ts';
import type { App, AppOpts } from './ai-apps.ts';

interface Change {
  id: string;
  label: string;
  log: string;
}

export function createAi(ctx: Ctx): Screen {
  const t = cs.ai, s = ctx.state;
  const workdays = nextWorkdays(ctx.today);
  const days = workdays.map(d => t.days[d.getDay()] + ' ' + d.getDate() + '. ' + (d.getMonth() + 1) + '.');
  const testDay = t.daysOn[workdays[1]!.getDay()]!;
  // rezervace otevře druhý pracovní den, obsazené časy v zadání chyby musí sedět s ním
  const busyTimes = (BUSY[1] ?? []).join(' a' + NBSP);

  const root = el(`<section class="view t-ai" id="v-ai" hidden><div class="container">
  ${viewHead('ai', t.tagNote, t.title, t.sub)}
  <div class="panel">
    <h3>${t.pick}</h3>
    <div class="ideas" id="a-ideas">${IDEAS.map(k => `<button type="button" class="idea" data-idea="${k}" aria-pressed="false"><b>${cs.ideas[k]}</b><span>${t.ideas[k].blurb}</span></button>`).join('')}</div>
    <div class="build" id="a-build" hidden>
      <div class="stack">
        <div class="term" aria-live="polite">
          <div class="term-bar"><i></i><i></i><i></i><span>${t.termBar}</span></div>
          <div class="log" id="a-log"></div>
          <div class="codeview" id="a-code"></div>
        </div>
        <p class="term-note">${t.termNote}</p>
      </div>
      <div class="preview" id="a-preview">
        <p class="kicker">${t.previewKicker}</p>
        <div class="device empty" id="a-app">${t.previewEmpty}</div>
      </div>
    </div>
    <div id="a-bug-wrap" hidden style="margin-top:18px">
      <h3>${t.bugTitle}</h3>
      <p class="hint">${t.bugHint}</p>
      <p class="hint" id="a-bug-ctx"></p>
      <div class="options" id="a-bug"></div>
      <div class="feedback" id="a-bug-fb" hidden></div>
      <div class="btn-row" id="a-fix-row" hidden style="margin-top:12px"><button type="button" class="btn btn-primary" id="a-fix"></button></div>
    </div>
    <div id="a-changes-wrap" hidden style="margin-top:18px">
      <h3>${t.changesTitle}</h3>
      <p class="hint">${t.changesHint}</p>
      <div class="changes" id="a-changes"></div>
    </div>
  </div>
  ${claimBar('ai', 'a-done', t.done)}
</div></section>`);

  const log = $(root, '#a-log'), code = $(root, '#a-code'), device = $(root, '#a-app');
  const build = $(root, '#a-build'), preview = $(root, '#a-preview'), wrap = $(root, '#a-changes-wrap'), changes = $(root, '#a-changes');
  const bugWrap = $(root, '#a-bug-wrap'), bugBox = $(root, '#a-bug'), bugFb = $(root, '#a-bug-fb'), fixRow = $(root, '#a-fix-row');
  const fixBtn = $<HTMLButtonElement>(root, '#a-fix');
  let run = 0;
  let fixNow: (() => void) | null = null;
  fixBtn.addEventListener('click', () => fixNow?.());

  function aiLog(text: string, ok = false) {
    const d = document.createElement('div');
    d.textContent = text;
    if (ok) d.className = 'ok';
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  async function buildIdea(key: IdeaKey) {
    const my = ++run;
    const steps = t.ideas[key].steps.map(x => fill(x, { den: testDay }));
    const lines = ideaCode(key, days);
    startIdea(s, key, ctx.now());
    $$(root, '#a-ideas .idea').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.idea === key)));
    build.hidden = false;
    ctx.reveal(build);
    log.innerHTML = '';
    code.textContent = '';
    device.className = 'device empty';
    device.textContent = t.working;
    wrap.hidden = true;
    bugWrap.hidden = true;
    fixNow = null;
    const opts: AppOpts = {};
    const app: App = createApp(key, days);
    const half = Math.ceil(lines.length / 2);
    for (let i = 0; i < steps.length; i++) {
      await ctx.wait(i === 0 ? 200 : 700);
      if (my !== run) return;
      aiLog(steps[i]!, i === steps.length - 1);
      if (i === 2) code.textContent = lines.slice(0, half).join('\n');
      if (i === 3) code.textContent = lines.join('\n');
    }
    device.className = 'device';
    app.render(device, opts);
    ideaBuilt(s, key);
    ctx.reveal(preview);
    showBug(key, my, app, opts);
  }

  // hledání chyby: stejně jako u dat špatná odpověď zmizí, po dvou špatných se ukáže správná
  function showBug(key: IdeaKey, my: number, app: App, opts: AppOpts) {
    const bug = t.ideas[key].bug;
    $(root, '#a-bug-ctx').textContent = fill(bug.ctx, { den: testDay, times: busyTimes });
    bugFb.hidden = true;
    fixRow.hidden = true;
    fixBtn.disabled = false;
    fixBtn.textContent = bug.fix.label;
    fixNow = () => applyFix(key, my, app, opts);
    bugBox.innerHTML = '';
    let wrong = 0;
    const opt = bug.options.map(o => {
      const b = el<HTMLButtonElement>('<button type="button" class="opt"></button>');
      b.textContent = o.t;
      bugBox.appendChild(b);
      return b;
    });
    const okIdx = bug.options.findIndex(o => 'ok' in o && o.ok);
    const found = () => {
      opt.forEach(b => { b.disabled = true; });
      fixRow.hidden = false;
      const a = ctx.root.activeElement;
      if (!a || bugBox.contains(a)) fixBtn.focus({ preventScroll: true });
      ctx.reveal(fixRow);
    };
    opt.forEach((b, i) => b.addEventListener('click', () => {
      const o = bug.options[i]!;
      bugFb.hidden = false;
      if (i === okIdx) {
        b.classList.add('ok');
        bugFb.className = 'feedback ok';
        bugFb.textContent = t.bugOk + ' ' + o.why;
        return found();
      }
      b.classList.add('no');
      b.disabled = true;
      bugFb.className = 'feedback no';
      bugFb.textContent = o.why;
      if (++wrong >= 2) {
        opt[okIdx]!.classList.add('ok');
        bugFb.textContent = o.why + ' ' + t.bugRevealed + ' ' + bug.options[okIdx]!.why;
        found();
      }
    }));
    bugWrap.hidden = false;
  }

  async function applyFix(key: IdeaKey, my: number, app: App, opts: AppOpts) {
    if (fixBtn.disabled) return;
    fixBtn.disabled = true;
    aiLog(fill(t.logFix, { log: t.ideas[key].bug.fix.log }));
    await ctx.wait(650);
    if (my !== run) return;
    aiLog(t.logCheck);
    await ctx.wait(450);
    if (my !== run) return;
    opts.fixed = true;
    app.render(device, opts);
    aiLog(t.logFixed, true);
    fixRow.hidden = true;
    showChanges(key, my, app, opts);
    ctx.reveal(preview);
  }

  function showChanges(key: IdeaKey, my: number, app: App, opts: AppOpts) {
    const list: Change[] = [...Object.entries(t.ideas[key].changes).map(([id, c]) => ({ id, ...c })), { id: 'dark', ...t.dark }];
    changes.innerHTML = '';
    for (const ch of list) {
      const b = el<HTMLButtonElement>('<button type="button" class="btn btn-ghost"></button>');
      b.textContent = ch.label;
      b.addEventListener('click', () => applyChange(key, ch, b, my, app, opts));
      changes.appendChild(b);
    }
    wrap.hidden = false;
    // fokus z tlačítka opravy, které právě zmizelo, na první úpravu
    const a = ctx.root.activeElement;
    if (!a || a === fixBtn) $<HTMLButtonElement>(changes, '.btn').focus({ preventScroll: true });
  }

  async function applyChange(key: IdeaKey, ch: Change, btn: HTMLButtonElement, my: number, app: App, opts: AppOpts) {
    btn.disabled = true;
    aiLog(fill(t.logChange, { log: ch.log }));
    await ctx.wait(650);
    if (my !== run) return;
    aiLog(t.logCheck);
    await ctx.wait(450);
    if (my !== run) return;
    opts[ch.id] = true;
    device.classList.toggle('dark', !!opts.dark);
    app.render(device, opts);
    ctx.reveal(preview);
    aiLog(t.logDone, true);
    // odznak a hodnocení až po dokončené úpravě, stejná úprava téže aplikace se počítá jednou
    if (changeApplied(s, key, ch.id, ctx.now())) ctx.completed('ai', true);
  }

  $$(root, '#a-ideas .idea').forEach(b => b.addEventListener('click', () => buildIdea(b.dataset.idea as IdeaKey)));

  return {
    el: root,
    heading: $(root, 'h2'),
    destroy() { run++; },
  };
}
