/* Ikony a kresby z prototypu (beze změny). */
import type { PathKey } from '../logic/types.ts';

/** Třída tématu ukázky, stejně jako META.cls v prototypu. */
export const THEME: Record<PathKey, string> = { data: 't-data', ai: 't-ai', hry: 't-game', kyber: 't-sec' };

export const CARD_BLOB = '<svg class="blob" viewBox="0 0 156 108" aria-hidden="true"><path d="M0 0H156C143 22 136 46 114 60C92 75 64 63 44 80C30 92 16 104 0 108Z" fill="#FABA20"/></svg>';

const ICO = '<svg class="ico" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="#212529" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">';
export const CARD_ICON: Record<PathKey, string> = {
  data: ICO + '<path d="M5 41h30"/><rect x="8" y="25" width="6" height="16" rx="1.5" fill="#FFFFFF"/><rect x="17" y="17" width="6" height="24" rx="1.5" fill="#FFFFFF"/><rect x="26" y="31" width="6" height="10" rx="1.5" fill="#FFFFFF"/><circle cx="33" cy="15" r="8" fill="#FFFFFF"/><path d="M39 21l6 6"/></svg>',
  ai: ICO + '<rect x="4" y="8" width="32" height="27" rx="3" fill="#FFFFFF"/><path d="M4 15h32"/><path d="M10 22h13M10 28h8"/><path d="M38 25l1.8 4.9L45 32l-5.2 2.1L38 39l-1.8-4.9L31 32l5.2-2.1z" fill="#FFFFFF"/></svg>',
  hry: ICO + '<path d="M14 13h20a10 10 0 0 1 9.7 12.6l-2 7.4a5 5 0 0 1-8.4 2.2L29.5 31h-11l-3.8 4.2a5 5 0 0 1-8.4-2.2l-2-7.4A10 10 0 0 1 14 13z" fill="#FFFFFF"/><path d="M14 19.5v7M10.5 23h7"/><circle cx="31.5" cy="21" r="1.7" fill="#212529"/><circle cx="35.5" cy="25.5" r="1.7" fill="#212529"/></svg>',
  kyber: ICO + '<path d="M24 4l16 6.5v10.5c0 10.5-6.8 17.8-16 22-9.2-4.2-16-11.5-16-22V10.5z" fill="#FFFFFF"/><circle cx="24" cy="21" r="4.2"/><path d="M24 25.2v7.3"/></svg>',
};

export const DOODLES = '<svg class="doodle d-curve" viewBox="0 0 340 170" aria-hidden="true" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"><path d="M6 164C52 70 132 150 180 86S270 6 336 24" stroke-dasharray="10 11"/></svg>' +
  '<svg class="doodle d-x" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"><path d="M4 4l12 12M16 4L4 16"/></svg>' +
  '<svg class="doodle d-o" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="#FFFFFF" stroke-width="3"><circle cx="10" cy="10" r="6.5"/></svg>';

export const HERO_ART = `<svg class="hero-art" viewBox="0 0 440 330" aria-hidden="true" fill="none" stroke="#212529" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8 318C70 268 54 196 132 176S292 188 324 110S404 36 434 46" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="10 11"/>
  <rect x="92" y="58" width="272" height="180" rx="12" fill="#FFFFFF"/>
  <rect x="108" y="74" width="240" height="148" rx="5" fill="#E3F5FB" stroke-width="2.4"/>
  <rect x="109.5" y="196" width="88" height="24.5" fill="#212529" stroke="none"/>
  <rect x="238" y="196" width="108.5" height="24.5" fill="#212529" stroke="none"/>
  <rect x="109.5" y="196" width="88" height="6" fill="#69CCEA" stroke="none"/>
  <rect x="238" y="196" width="108.5" height="6" fill="#69CCEA" stroke="none"/>
  <path d="M156 192Q204 104 256 190" stroke-width="3" stroke-dasharray="1 9"/>
  <g transform="rotate(-10 213 151)"><rect x="199" y="136" width="28" height="30" rx="5" fill="#FABA20"/><circle cx="216" cy="149" r="2.3" fill="#212529" stroke="none"/><circle cx="223" cy="149" r="2.3" fill="#212529" stroke="none"/></g>
  <circle cx="286" cy="158" r="9" fill="#FABA20" stroke-width="2.6"/>
  <path d="M326 196V146" stroke-width="2.8"/>
  <path d="M326 146l20 8-20 8z" fill="#E9225B" stroke-width="2.4"/>
  <path d="M62 238h332l-14 22a8 8 0 0 1-7 4H83a8 8 0 0 1-7-4z" fill="#FFFFFF"/>
  <path d="M200 238v5h56v-5" stroke-width="2.4"/>
  <g transform="rotate(-7 66 66)"><rect x="16" y="24" width="104" height="78" rx="10" fill="#FFFFFF"/><rect x="34" y="58" width="13" height="30" rx="2" fill="#17496F" stroke="none"/><rect x="55" y="44" width="13" height="44" rx="2" fill="#17496F" stroke="none"/><rect x="76" y="76" width="13" height="12" rx="2" fill="#E9225B" stroke="none"/><path d="M30 92h76" stroke-width="2.4"/></g>
  <circle cx="394" cy="200" r="34" fill="#FFFFFF"/>
  <path d="M394 178l16 6v10c0 10-7 17-16 21-9-4-16-11-16-21v-10z" fill="#FABA20" stroke-width="2.8"/>
  <path d="M388 196l5 5 8-9" stroke-width="2.8"/>
  <path d="M14 214h80a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8H48l-14 12v-12H14a8 8 0 0 1-8-8v-34a8 8 0 0 1 8-8z" fill="#FFFFFF"/>
  <path d="M30 238l2.4 6.6L39 247l-6.6 2.4L30 256l-2.4-6.6L21 247l6.6-2.4z" fill="#FABA20" stroke-width="2.2"/>
  <path d="M52 236h34M52 250h22" stroke-width="2.6"/>
  <path d="M398 92l2.6 7.4 7.4 2.6-7.4 2.6-2.6 7.4-2.6-7.4-7.4-2.6 7.4-2.6z" fill="#FFFFFF" stroke="none"/>
  <path d="M150 26l1.8 5.2 5.2 1.8-5.2 1.8-1.8 5.2-1.8-5.2-5.2-1.8 5.2-1.8z" fill="#FFFFFF" stroke="none"/>
</svg>`;
