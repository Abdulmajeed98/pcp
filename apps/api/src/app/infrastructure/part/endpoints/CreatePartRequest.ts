import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsString, Matches, ValidateIf } from 'class-validator';

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

  toCommandInput(): CreatePartCommandInput {
    return new CreatePartCommandInput(
      Category.withKey(this.category) as Category,
      this.name,
      this.manufacturer,
      this.partNumbers,
    );
  }
}
