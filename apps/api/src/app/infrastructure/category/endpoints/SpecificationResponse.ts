import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Specification } from '~/domain/specification/Specification';
import type { SpecificationKind } from '~/domain/specification/Specification';

const kinds: SpecificationKind[] = [
  'wholeNumber',
  'decimalNumber',
  'text',
  'yesNo',
  'oneOf',
  'severalOf',
  'listOfText',
  'listOfRows',
];

export class SpecificationResponse {
  @ApiProperty({
    description:
      "The specification's place in a Part's specifications, in OpenDB's field names and nesting. For a field of a row, its name in the row.",
    example: 'specifications.memory.types',
  })
  readonly path: string;

  @ApiProperty({
    description: "The specification's English label.",
    example: 'Memory types',
  })
  readonly label: string;

  @ApiProperty({
    description: 'The kind of value it holds.',
    enum: kinds,
    example: 'severalOf',
  })
  readonly kind: SpecificationKind;

  @ApiPropertyOptional({ description: 'The unit of a number.', example: 'W' })
  readonly unit?: string;

  @ApiPropertyOptional({
    description: 'The fixed set, for one or several of a fixed set.',
    type: [String],
    example: ['DDR3', 'DDR4', 'DDR5'],
  })
  readonly values?: string[];

  @ApiPropertyOptional({
    description: 'The fields of each row, for a list of rows.',
    type: () => [SpecificationResponse],
  })
  readonly fields?: SpecificationResponse[];

  @ApiProperty({ description: 'Whether a Compatibility Rule reads it.', example: true })
  readonly needed: boolean;

  @ApiProperty({
    description: 'Whether 0 cannot be true for it, so that 0 stands for "not known".',
    example: false,
  })
  readonly zeroMeansMissing: boolean;

  private constructor(specification: Specification) {
    this.path = specification.getPath();
    this.label = specification.getLabel();
    this.kind = specification.getKind();
    this.needed = specification.isNeeded();
    this.zeroMeansMissing = specification.doesZeroMeanMissing();

    const unit = specification.getUnit();
    if (unit !== undefined) this.unit = unit;
    const values = specification.getValues();
    if (values !== undefined) this.values = [...values];
    const fields = specification.getFields();
    if (fields !== undefined) this.fields = fields.map(SpecificationResponse.of);
  }

  static of(specification: Specification): SpecificationResponse {
    return new SpecificationResponse(specification);
  }
}
