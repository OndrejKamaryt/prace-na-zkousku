/* Ceny s příspěvkem z DIGIkurzů, jako priceFor() v prototypu, ale z konfigurace. */
import config from '../content/config.json';
import type { PathKey } from './types.ts';

export interface DigiRules {
  rate: number;
  cap: number;
}
export interface Price {
  price: number;
  contrib: number;
  pay: number;
  digikurzy: boolean;
}

export function priceFor(k: PathKey, lowIncome: boolean, rules: DigiRules = config.digikurzy, course = config.courses[k]): Price {
  const price = course.price;
  if (!course.digikurzy) return { price, contrib: 0, pay: price, digikurzy: false };
  const contrib = lowIncome ? Math.min(price, rules.cap) : Math.min(Math.floor(price * rules.rate), rules.cap);
  return { price, contrib, pay: price - contrib, digikurzy: true };
}

/** Zaškrtávátko nízkopříjmové skupiny se ukazuje jen tam, kde změní částku. */
export function lowIncomeMatters(k: PathKey, rules: DigiRules = config.digikurzy, course = config.courses[k]): boolean {
  return priceFor(k, true, rules, course).pay !== priceFor(k, false, rules, course).pay;
}
