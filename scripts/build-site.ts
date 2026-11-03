/* Sestaví web pro GitHub Pages do _site/:
   - index.html: ukázka pro tým, jen widget tak, jak ho uvidí návštěvník webu (demo.html),
   - vlozeni.html: widget vložený do napodobeniny coderslab.cz (test-host.html),
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

// napodobenina webu je hlavně pro testy, kolegům ji ukážeme jen s popisem a cestou zpět
let hosted = readFileSync(new URL('test-host.html', dist), 'utf8');
hosted = replaceOnce(hosted, 'Testovací stránka: napodobenina coderslab.cz s vloženou Prací na zkoušku',
  'Ukázka: takhle bude Práce na zkoušku vložená na coderslab.cz. <a href="./" style="color:#FFFFFF">Zpět na ukázku</a>');
hosted = replaceOnce(hosted, 'Data se nikam neposílají.</div>', 'Ukázka vložení widgetu, data se nikam neposílají.</div>');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyFileSync(new URL('demo.html', dist), new URL('index.html', out));
writeFileSync(new URL('vlozeni.html', out), hosted);
copyFileSync(new URL('index.html', dist), new URL('samostatna.html', out));
copyFileSync(new URL('prace-na-zkousku.js', dist), new URL('prace-na-zkousku.js', out));
copyFileSync(new URL('prototyp/prace-na-zkousku.html', root), new URL('prototyp.html', out));
console.log('Hotovo: _site/index.html (ukázka pro tým), vlozeni.html, samostatna.html, prace-na-zkousku.js, prototyp.html');
