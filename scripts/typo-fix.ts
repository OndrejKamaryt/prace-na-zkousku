/* Doplní pevné mezery do src/content/cs.json. Spuštění: npm run typo:fix */
import { readFileSync, writeFileSync } from 'node:fs';
import { findTypographyIssues, fixTypographyDeep } from '../src/logic/typography.ts';

const file = new URL('../src/content/cs.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const issues = findTypographyIssues(data);
if (!issues.length) {
  console.log('cs.json je v pořádku.');
} else {
  writeFileSync(file, JSON.stringify(fixTypographyDeep(data), null, 2) + '\n');
  console.log('Opraveno textů: ' + issues.length);
  issues.forEach(p => console.log('  ' + p));
}
