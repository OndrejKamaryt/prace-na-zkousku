/* Sestaví ukázku pro tým na GitHub Pages do _site/: jen samostatnou stránku
   (index.html, data-variant="standalone") a sestavený widget prace-na-zkousku.js.
   Napodobenina webu (test-host.html) slouží jen testům a do ukázky nepatří.
   Nejdřív spustí vite build, takže stačí: node scripts/build-site.ts */
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const out = new URL('_site/', root);

await build({ root: fileURLToPath(root), logLevel: 'warn' });

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyFileSync(new URL('index.html', dist), new URL('index.html', out));
copyFileSync(new URL('prace-na-zkousku.js', dist), new URL('prace-na-zkousku.js', out));
console.log('Hotovo: _site/index.html (samostatná stránka), prace-na-zkousku.js');
