import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

import {
  LabelledRows,
  LabelledSpecification,
  LabelledValue,
} from '~/domain/specification/LabelledSpecification';
import { Specification } from '~/domain/specification/Specification';
import type { SpecificationKind } from '~/domain/specification/Specification';

// What a Part holds for one specification, as the answer gives it.
type LabelledValueResponse =
  | number
  | string
  | boolean
  | string[]
  | LabelledSpecificationResponse[][];

function valueOf(value: LabelledValue): LabelledValueResponse {
  if (value instanceof LabelledRows) {
    return value.getRows().map((row) => row.map(LabelledSpecificationResponse.of));
  }
  if (typeof value === 'object') return [...value];
  return value;
}

// One specification a Part holds, with its value, beside its English label
// and its unit, as Shoppers read it (LANG-3).
export class LabelledSpecificationResponse {
  @ApiProperty({
    description:
      "The specification's place in a Part's specifications, in OpenDB's field names and nesting, as its Category's specification list names it. For a field of a row, its name in the row.",
    example: 'specifications.tdp',
  })
  readonly path: string;

  @ApiProperty({ description: "The specification's English label.", example: 'TDP' })
  readonly label: string;

  @ApiProperty({
    description: 'The kind of value it holds, which says how to show it.',
    enum: Specification.kinds(),
    example: 'wholeNumber',
  })
  readonly kind: SpecificationKind;

  @ApiProperty({
    description: 'The unit of a number, or null when it has none.',
    type: String,
    nullable: true,
    example: 'W',
  })
  readonly unit: string | null;

  @ApiProperty({
    description:
      'What the Part holds: a number, in the unit; a text; true or false, for yes or no; a list of texts, for a choice of several or a list of text; or, for a list of rows, each row as the list of the fields it holds, answered as a specification is, and no rows when the Part has none.',
    oneOf: [
      { type: 'number' },
      { type: 'string' },
      { type: 'boolean' },
      { type: 'array', items: { type: 'string' } },
      {
        type: 'array',
        items: {
          type: 'array',
          items: { $ref: getSchemaPath('LabelledSpecificationResponse') },
        },
      },
    ],
    example: 65,
  })
  readonly value: LabelledValueResponse;

  private constructor(labelled: LabelledSpecification) {
    this.path = labelled.getPath();
    this.label = labelled.getLabel();
    this.kind = labelled.getKind();
    this.unit = labelled.getUnit() ?? null;
    this.value = valueOf(labelled.getValue());
  }

  static of(labelled: LabelledSpecification): LabelledSpecificationResponse {
    return new LabelledSpecificationResponse(labelled);
  }
}
