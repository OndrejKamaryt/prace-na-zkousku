/* Vstupní bod widgetu. Skript vložený na stránku dvakrát nesmí registraci shodit (A15). */
import { PraceNaZkousku } from './widget.ts';

if (!customElements.get('prace-na-zkousku')) customElements.define('prace-na-zkousku', PraceNaZkousku);

export { PraceNaZkousku };
