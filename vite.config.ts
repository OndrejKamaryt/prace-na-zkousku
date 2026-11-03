import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/* V library mode Vite HTML nesestavuje. Samostatná stránka, ukázka pro tým
   a testovací napodobenina webu se proto do dist/ jen zkopírují a místo
   zdrojového src/main.ts načtou sestavený prace-na-zkousku.js. */
function pages(files: string[]): Plugin {
  return {
    name: 'pnz-pages',
    apply: 'build',
    generateBundle() {
      for (const fileName of files) {
        const html = readFileSync(fileName, 'utf8');
        if (!html.includes('src="/src/main.ts"')) throw new Error(fileName + ' nenačítá /src/main.ts');
        this.emitFile({ type: 'asset', fileName, source: html.replace('src="/src/main.ts"', 'src="./prace-na-zkousku.js"') });
      }
    },
  };
}

export default defineConfig({
  plugins: [pages(['index.html', 'demo.html', 'test-host.html'])],
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: () => 'prace-na-zkousku.js',
    },
    target: 'es2022',
  },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
