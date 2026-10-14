import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsObject, IsString, Matches, ValidateIf } from 'class-validator';

import { Category } from '~/domain/part/Category';
import { CreatePartCommandInput } from '~/domain/part/CreatePartCommand';

// A name or a manufacturer is kept as it was written, and has to hold more
// than spaces.
const notBlank = /\S/;

export class CreatePartRequest {
  @ApiProperty({
    description: "The Part's Category, which never changes afterwards.",
    enum: Category.keys(),
    example: 'cpu',
  })
  @IsIn(Category.keys())
  readonly category!: string;

  @ApiProperty({ description: "The Part's name.", example: 'AMD Ryzen 5 7600' })
  @IsString()
  @Matches(notBlank)
  readonly name!: string;

  @ApiProperty({ description: "The Part's manufacturer.", example: 'AMD' })
  @IsString()
  @Matches(notBlank)
  readonly manufacturer!: string;

  @ApiPropertyOptional({
    description: "The manufacturer's part numbers. None is given as an empty list.",
    type: [String],
    example: ['100-100001015BOX'],
  })
  // Left out, the list is empty. Given, even as null, it has to be a list.
  @ValidateIf((_request, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  readonly partNumbers: string[] = [];

  @ApiPropertyOptional({
    description:
      "The Part's specifications, in OpenDB's field names and nesting. Its Category's specification list says what they may hold. Left out, the Part has none.",
    type: 'object',
    additionalProperties: true,
    example: { socket: 'AM5', specifications: { tdp: 65, memory: { types: ['DDR5'] } } },
  })
  // Left out, there are none. Given, even as null, it has to be an object.
  // What it holds is checked against the Category's list by the use case.
  @ValidateIf((_request, value) => value !== undefined)
  @IsObject()
  readonly specifications: Record<string, unknown> = {};

  toCommandInput(): CreatePartCommandInput {
    return new CreatePartCommandInput(
      Category.withKey(this.category) as Category,
      this.name,
      this.manufacturer,
      this.partNumbers,
      this.specifications,
    );
  }
}
