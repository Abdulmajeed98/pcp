import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsString, Matches, ValidateIf } from 'class-validator';

import type { SpecificationDocument } from '~/domain/specification/specification-document';

// A name or a manufacturer is kept as it was written, and has to hold more
// than spaces.
const notBlank = /\S/;

// What creating a Part and editing one both send: everything the Admin may
// change. Creating a Part adds its Category, which an edit never changes.
export class PartFieldsRequest {
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
  readonly specifications: SpecificationDocument = {};
}
