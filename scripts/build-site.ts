/* Sestaví web pro GitHub Pages do _site/:
   - index.html: prototyp vložený do stránky, která napodobuje coderslab.cz
     (lepicí hlavička webu, bez tmavé hlavičky prototypu, odznaky ve světlém
     pruhu nahoře ve widgetu, překryvy nad hlavičkou), tak jak bude widget na webu,
   - prototyp.html: původní prototyp beze změny.
   Je to jen ukázka pro kolegy. Skutečný widget se Shadow DOM přijde ve fázi 2.
   Spuštění: node scripts/build-site.ts */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const out = new URL('_site/', root);
const src = readFileSync(new URL('prototyp/prace-na-zkousku.html', root), 'utf8');

function cut(html: string, start: string, end: string): { html: string; part: string } {
  const a = html.indexOf(start);
  const b = html.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error('V prototypu chybí ' + start);
  return { html: html.slice(0, a) + html.slice(b + end.length), part: html.slice(a, b + end.length) };
}
function replaceOnce(html: string, find: string, put: string): string {
  if (html.split(find).length !== 2) throw new Error('V prototypu není právě jednou: ' + find);
  return html.replace(find, put);
}

// tmavá hlavička prototypu pryč, z ní se vezme jen ukazatel odznaků
let { html, part: header } = cut(src, '<header class="site">', '</header>');
const prog = /<a class="prog"[\s\S]*?<\/a>/.exec(header)?.[0];
if (!prog) throw new Error('V hlavičce chybí ukazatel odznaků');
html = cut(html, '<footer class="container foot-note">', '</footer>').html;

const HOST_CSS = `
/* ---- ukázka vložení: napodobenina coderslab.cz kolem widgetu ---- */
.cl-top{position:relative; z-index:1020}
@media (min-width:992px){ .cl-top{position:sticky; top:0} html{scroll-padding-top:191px} }
.cl-in{max-width:1110px; margin:0 auto; padding:0 16px; display:flex; align-items:center; gap:24px}
.cl-promo{background:var(--pink); color:#FFFFFF; font:500 15px/1.3 var(--head); min-height:60px; display:flex; align-items:center}
.cl-promo .cl-in{justify-content:center; text-align:center}
.cl-menu{background:var(--dark); color:#FFFFFF; min-height:59px; display:flex; align-items:center}
.cl-logo{display:flex; align-items:center; gap:10px; font:700 18px/1 var(--head); letter-spacing:.02em}
.cl-logo i{width:38px; height:38px; background:var(--yellow); display:grid; place-items:center; font-style:normal; color:var(--dark); font-size:17px}
.cl-links{display:flex; gap:22px; margin-left:auto; font:500 15px var(--head)}
.cl-burger{margin-left:auto; display:none; width:28px; height:2px; background:#FFFFFF; box-shadow:0 -8px 0 #FFFFFF, 0 8px 0 #FFFFFF}
.cl-sub{background:var(--cream); min-height:56px; display:flex; align-items:center; font:500 15px var(--head); border-bottom:1px solid var(--line)}
.cl-sub b{font-weight:700}
.cl-sub .cl-in span{color:var(--gray)}
@media (max-width:991px){ .cl-links, .cl-sub{display:none} .cl-burger{display:block} .cl-promo{font-size:14px} }
.cl-head{padding:28px 0 20px}
.cl-head p{color:var(--gray); font-size:14px}
.cl-head h1{font:700 32px/1.2 var(--head); margin:6px 0 0}
.cl-foot{background:var(--dark); color:#ADB5BD; font-size:14px; padding:28px 0; margin-top:40px}
body{padding-bottom:0}
/* widget: světlý pruh s odznaky místo tmavé hlavičky */
.pnz-bar{background:var(--light); border-top:1px solid var(--line); border-bottom:1px solid var(--line)}
.pnz-bar .container{display:flex; justify-content:flex-end; padding-top:8px; padding-bottom:8px}
.pnz-bar .prog{color:var(--dark); border-color:var(--line-strong); background:#FFFFFF}
.pnz-bar .mini{background:var(--surface-2)}
.pnz-bar .mini svg{stroke:var(--gray)}
/* překryvy nad lepicí hlavičkou webu (Bootstrap navbar má 1020 až 1030) */
.fab{z-index:2050} .celebrate{z-index:2100} #confetti{z-index:2110}
`;

const HOST_TOP = `
<div class="cl-top" aria-label="Napodobenina hlavičky coderslab.cz">
  <div class="cl-promo"><div class="cl-in">Ukázka: takhle bude Práce na zkoušku vložená na coderslab.cz</div></div>
  <div class="cl-menu"><div class="cl-in"><span class="cl-logo"><i>CL</i>CODERS LAB</span><span class="cl-links"><span>Kurzy</span><span>Webináře</span><span>Pro firmy</span><span>Blog</span><span>Kontakt</span></span><span class="cl-burger" aria-hidden="true"></span></div></div>
  <div class="cl-sub"><div class="cl-in"><b>Práce na zkoušku</b><span>Jak to funguje</span><span>DIGIkurzy</span><span>Časté otázky</span></div></div>
</div>
<div class="cl-head"><div class="cl-in" style="display:block"><p>Úvod / Práce na zkoušku</p><h1>Práce na zkoušku</h1></div></div>
`;

const HOST_FOOT = `
<footer class="cl-foot"><div class="cl-in" style="display:block">Patička webu coderslab.cz (napodobenina). Ukázka vložení widgetu, data se nikam neposílají.</div></footer>
`;

/* Schválené změny textů (PLAN.md, „Rozhodnuto“). Prototyp zůstává beze změny
   jako předloha, demo už ukazuje odsouhlasené znění. */
const APPROVED: [RegExp, string][] = [
  // jedna hotová ukázka ještě není „nejsilnější směr“ (3. 11. 2026)
  [/'Tvůj nejsilnější směr'/, "(ds.length > 1 ? 'Tvůj nejsilnější směr' : 'Tvoje první práce na zkoušku')"],
  // podnikatelé s IČO se také můžou registrovat (3. 11. 2026)
  [/kdy práci máš\.<\/li>/, 'kdy práci máš nebo podnikáš na IČO.</li>'],
  // rozhodnutí 13
  [/ Ceny jsou v[  ]prototypu orientační\./, ''],
  // rozhodnutí 20
  [/Jsem student posledního ročníku, nebo jsem/, 'Studuji poslední ročník, nebo jsem'],
];
for (const [find, put] of APPROVED) {
  if ((html.match(new RegExp(find, 'g')) ?? []).length !== 1) throw new Error('Schválený text nesedí s prototypem: ' + find);
  html = html.replace(find, put);
}

// za poslední blok stylů před obsahem, ať přepisy vyhrají; další </style> jsou v textech ukázek
const styleEnd = html.lastIndexOf('</style>', html.indexOf('<main>'));
if (styleEnd < 0) throw new Error('V prototypu chybí styly před <main>');
html = html.slice(0, styleEnd) + HOST_CSS + html.slice(styleEnd);
html = replaceOnce(html, '<main>', HOST_TOP + '<main>\n<div class="pnz-bar"><div class="container">' + prog + '</div></div>');
html = replaceOnce(html, '</main>', '</main>' + HOST_FOOT);

mkdirSync(out, { recursive: true });
writeFileSync(new URL('index.html', out), html);
copyFileSync(new URL('prototyp/prace-na-zkousku.html', root), new URL('prototyp.html', out));
console.log('Hotovo: _site/index.html (vložení do webu), _site/prototyp.html');
