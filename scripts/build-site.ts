/* Sestaví web pro GitHub Pages do _site/:
   - index.html: skutečný widget vložený do napodobeniny coderslab.cz (test-host.html),
   - samostatna.html: samostatná stránka (data-variant="standalone"),
   - prace-na-zkousku.js: sestavený widget,
   - prototyp.html: původní prototyp beze změny, pro porovnání.
   Nejdřív spustí vite build, takže stačí: node scripts/build-site.ts */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const out = new URL('_site/', root);

await build({ root: fileURLToPath(root), logLevel: 'warn' });

function replaceOnce(html: string, find: string, put: string): string {
  if (html.split(find).length !== 2) throw new Error('V test-host.html není právě jednou: ' + find);
  return html.replace(find, put);
}

// demo je pro kolegy: stejná stránka jako testy, jen s popisem ukázky a odkazy na ostatní verze
let demo = readFileSync(new URL('test-host.html', dist), 'utf8');
demo = replaceOnce(demo, 'Testovací stránka: napodobenina coderslab.cz s vloženou Prací na zkoušku', 'Ukázka: takhle bude Práce na zkoušku vložená na coderslab.cz');
demo = replaceOnce(demo, 'Data se nikam neposílají.</div>',
  'Ukázka vložení widgetu, data se nikam neposílají. <a href="samostatna.html" style="color:#FFFFFF">Samostatná stránka</a>, <a href="prototyp.html" style="color:#FFFFFF">původní prototyp</a>.</div>');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(new URL('index.html', out), demo);
copyFileSync(new URL('index.html', dist), new URL('samostatna.html', out));
copyFileSync(new URL('prace-na-zkousku.js', dist), new URL('prace-na-zkousku.js', out));
copyFileSync(new URL('prototyp/prace-na-zkousku.html', root), new URL('prototyp.html', out));
console.log('Hotovo: _site/index.html (widget vložený do webu), samostatna.html, prace-na-zkousku.js, prototyp.html');
