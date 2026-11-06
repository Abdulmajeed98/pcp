import type { LabelledSpecificationResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';

// A Part's specification as its page writes it (DESIGN.md's The
// specifications): in English in every language, as the catalog holds it
// (LANG-3), one line each. A number is written in Western digits by
// `formatNumber`, grouped in thousands, with its unit after it; yes and no
// are the English words; text and a choice of one are as they are; a
// choice of several and a list of text are joined with commas. A list of
// rows, such as a motherboard's PCIe slots, takes a line for each row, each
// field by its English label in the row's own order, and a list with no
// rows, which the catalog holds for a motherboard with no M.2 slot, says
// none. What the API leaves out, the Part does not hold, and is never
// written.
export function specificationText(specification: LabelledSpecificationResponse): string[] {
  if (specification.kind === 'listOfRows') {
    const rows = (specification.value as LabelledSpecificationResponse[][])
      .map((row) => row.map((field) => `${field.label} ${oneLine(field)}`).join(' · '))
      .filter((line) => line !== '');
    return rows.length === 0 ? ['None'] : rows;
  }
  return [oneLine(specification)];
}

function oneLine({ kind, value, unit }: LabelledSpecificationResponse): string {
  switch (kind) {
    case 'wholeNumber':
    case 'decimalNumber': {
      const figure = formatNumber(value as number);
      return unit === null ? figure : `${figure} ${unit}`;
    }
    case 'yesNo':
      return value === true ? 'Yes' : 'No';
    case 'severalOf':
    case 'listOfText':
      return (value as string[]).join(', ');
    default:
      return String(value);
  }
}
