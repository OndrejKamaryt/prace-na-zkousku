/* Sestaví ukázku pro tým na GitHub Pages do _site/: jen samostatnou stránku
   (index.html, data-variant="standalone") a sestavený widget prace-na-zkousku.js.
   Napodobenina webu (test-host.html) slouží jen testům a do ukázky nepatří.
   Nejdřív spustí vite build, takže stačí: node scripts/build-site.ts */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const out = new URL('_site/', root);

await build({ root: fileURLToPath(root), logLevel: 'warn' });

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyFileSync(new URL('prace-na-zkousku.js', dist), new URL('prace-na-zkousku.js', out));

// GitHub Pages posílá max-age=600 a skript se jmenuje pořád stejně, takže by prohlížeč po nasazení
// držel starou verzi. Otisk v adrese zařídí, že po obnovení stránky si vezme nový skript hned.
const script = 'src="./prace-na-zkousku.js"';
const html = readFileSync(new URL('index.html', dist), 'utf8');
if (!html.includes(script)) throw new Error('V dist/index.html chybí ' + script);
const version = createHash('sha256').update(readFileSync(new URL('prace-na-zkousku.js', dist))).digest('hex').slice(0, 10);
writeFileSync(new URL('index.html', out), html.replace(script, 'src="./prace-na-zkousku.js?v=' + version + '"'));
console.log('Hotovo: _site/index.html (samostatná stránka), prace-na-zkousku.js');
