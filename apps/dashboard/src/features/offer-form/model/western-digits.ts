import { westernDigitsIn } from '@/shared/lib';

// A number as a Vendor's keyboard writes it, as the API reads it: Western
// digits and a point, and nothing between the digits.
//
// A Kurdish or an Arabic keyboard types Arabic-Indic or Eastern Arabic-Indic
// digits and its decimal separator, which become the Western digits and the
// point. A Vendor may group thousands with a comma, the Arabic thousands
// separator, ٬, the Arabic comma, ،, or a space of any width, and these are
// dropped. The API takes numbers in Western digits only, and says what is
// wrong with what is left.
const grouping = /[,٬،\s]/gu;

export function westernNumberOf(typed: string): string {
  return westernDigitsIn(typed).replace(grouping, '');
}
