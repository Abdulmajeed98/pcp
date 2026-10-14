import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { Category } from '~/domain/part/Category';
import { CreatePartCommandInput } from '~/domain/part/CreatePartCommand';

// Space around a name is not part of it, and a name of spaces alone is empty.
function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreatePartRequest {
  @ApiProperty({
    description: "The Part's Category, which never changes afterwards.",
    enum: Category.keys(),
    example: 'cpu',
  })
  @IsIn(Category.keys())
  readonly category!: string;

  @ApiProperty({ description: "The Part's name.", example: 'AMD Ryzen 5 7600' })
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @ApiProperty({ description: "The Part's manufacturer.", example: 'AMD' })
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  readonly manufacturer!: string;

  @ApiPropertyOptional({
    description: "The manufacturer's part numbers. None is given as an empty list.",
    type: [String],
    example: ['100-100001015BOX'],
  })
  @IsOptional()
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
