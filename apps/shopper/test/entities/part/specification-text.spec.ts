import type { LabelledSpecificationResponse } from '@pcp/api-client';
import { describe, expect, it } from 'vitest';

import { specificationText } from '@/entities/part';

// A specification as the API answers it for a Visible Part.
function aSpecification(
  kind: LabelledSpecificationResponse['kind'],
  value: LabelledSpecificationResponse['value'],
  unit: string | null = null,
): LabelledSpecificationResponse {
  return { path: 'a.path', label: 'A label', kind, unit, value };
}

// A Part's specification as its page writes it, in English in every
// language (LANG-3): its value with its unit, in Western digits, one line
// each, and a list of rows a line for each row.
describe("a specification's text", () => {
  it('writes a number in Western digits with its unit after it', () => {
    expect(specificationText(aSpecification('decimalNumber', 4.2, 'GHz'))).toEqual([
      '4.2 GHz',
    ]);
    expect(specificationText(aSpecification('wholeNumber', 120, 'W'))).toEqual(['120 W']);
  });

  it('groups a large number in thousands, as every number on the platform is', () => {
    expect(specificationText(aSpecification('wholeNumber', 6000, 'MHz'))).toEqual([
      '6,000 MHz',
    ]);
  });

  it('writes a number with no unit alone', () => {
    expect(specificationText(aSpecification('wholeNumber', 8))).toEqual(['8']);
  });

  it('writes yes or no as the English word', () => {
    expect(specificationText(aSpecification('yesNo', true))).toEqual(['Yes']);
    expect(specificationText(aSpecification('yesNo', false))).toEqual(['No']);
  });

  it('writes text and a choice of one as they are', () => {
    expect(specificationText(aSpecification('text', 'Zen 4'))).toEqual(['Zen 4']);
    expect(specificationText(aSpecification('oneOf', 'AM5'))).toEqual(['AM5']);
  });

  it('writes a choice of several and a list of text with commas', () => {
    expect(specificationText(aSpecification('severalOf', ['DDR4', 'DDR5']))).toEqual([
      'DDR4, DDR5',
    ]);
    expect(specificationText(aSpecification('listOfText', ['Black', 'White']))).toEqual([
      'Black, White',
    ]);
  });

  it("writes each row of a list of rows on a line of its own, each field by its label, in the row's order", () => {
    const slot = (gen: string, quantity: number, lanes: number) => [
      { path: 'gen', label: 'Generation', kind: 'text' as const, unit: null, value: gen },
      {
        path: 'quantity',
        label: 'Slots',
        kind: 'wholeNumber' as const,
        unit: null,
        value: quantity,
      },
      {
        path: 'lanes',
        label: 'Lanes',
        kind: 'wholeNumber' as const,
        unit: null,
        value: lanes,
      },
    ];
    expect(
      specificationText(
        aSpecification('listOfRows', [slot('PCIe 5.0', 1, 16), slot('PCIe 4.0', 2, 4)]),
      ),
    ).toEqual([
      'Generation PCIe 5.0 · Slots 1 · Lanes 16',
      'Generation PCIe 4.0 · Slots 2 · Lanes 4',
    ]);
  });

  // A list of rows with no rows is a value: a motherboard with no M.2 slot
  // has none.
  it('writes a list of rows with no rows as none', () => {
    expect(specificationText(aSpecification('listOfRows', []))).toEqual(['None']);
  });
});
