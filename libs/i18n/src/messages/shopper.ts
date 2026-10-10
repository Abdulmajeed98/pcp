import type { Language } from '../languages';
import ar from './shopper/ar.json';
import ckb from './shopper/ckb.json';
import en from './shopper/en.json';

// The Shopper app's text. English is the source: its messages define what the
// other two languages must hold, and a key is type-checked against it.
export type ShopperMessages = typeof en;

// One file for each language, in next-intl's format, which is ICU.
export const shopperMessages: Record<Language, ShopperMessages> = { ckb, ar, en };
