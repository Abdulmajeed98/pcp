import type { VisiblePartResponse } from '@pcp/api-client';
import type { Language } from '@pcp/i18n';

// A Category, by the API's own key for it, which the shared terms name it by
// in each language and `CategoryIcon` draws.
export type Category = VisiblePartResponse['category'];

// Each Category's name in the Shopper app's addresses, in lower case with
// hyphens, mapped once, here, to the API's key: `/<language>/categories/<name>`.
// The map holds every key the API knows, so that a Category the API adds and
// this map lacks fails the type check. It is written in the catalog's fixed
// order of the eight, which every list of them follows.
const namesInTheAddress = {
  cpu: 'cpu',
  cpuCooler: 'cpu-cooler',
  motherboard: 'motherboard',
  ram: 'ram',
  storage: 'storage',
  gpu: 'gpu',
  case: 'case',
  psu: 'psu',
} as const satisfies Record<Category, string>;

// The eight Categories, in the catalog's order.
export const categories = Object.keys(namesInTheAddress) as Category[];

// The two groups the home page's sheet sets them in: the core of a PC, and
// what goes around it.
export const theCore = [
  'cpu',
  'cpuCooler',
  'motherboard',
  'ram',
  'storage',
] as const satisfies readonly Category[];
export const aroundIt = ['gpu', 'case', 'psu'] as const satisfies readonly Category[];

// A Category page's address, in a language.
export function categoryAddress(language: Language, category: Category): string {
  return `/${language}${categoryPath(category)}`;
}

// The part of a Category page's address after its language, as a page's
// preview names it in every language.
export function categoryPath(category: Category): string {
  return `/categories/${namesInTheAddress[category]}`;
}

// The Category a name in the address stands for, or none, for any other
// name: one the Shopper app does not write, in another case among them.
export function categoryOfTheAddress(name: string): Category | undefined {
  return categories.find((category) => namesInTheAddress[category] === name);
}
