import type { Language } from '../languages';
import ar from './shared/ar.json';
import ckb from './shared/ckb.json';
import en from './shared/en.json';

// The shared terms: text that both frontends show, with the same wording, so
// that a Shopper and a Vendor read the same word. Here that is the names of
// the eight Categories.
//
// A shared term is plain text, with no placeholder and no plural. next-intl
// and i18next each write those their own way, and plain text is the one
// thing both read alike. English is the source: its terms define what the
// other two languages must hold, and a key is type-checked against it.
export type SharedTerms = typeof en;

// One file for each language. A frontend adds them to its own text.
export const sharedTerms: Record<Language, SharedTerms> = { ckb, ar, en };
