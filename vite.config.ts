import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: () => 'prace-na-zkousku.js',
    },
    target: 'es2022',
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
