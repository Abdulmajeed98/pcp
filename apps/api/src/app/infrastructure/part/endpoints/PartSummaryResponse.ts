import { ApiProperty } from '@nestjs/swagger';

import { Category } from '~/domain/part/Category';
import { Part } from '~/domain/part/Part';

// A Part as a list of found Parts shows it.
export class PartSummaryResponse {
  @ApiProperty({
    description: "The Part's identifier on the platform.",
    example: '3b8f0c52-6a1e-4f3d-9c27-5e8a1d4b7f60',
  })
  readonly id: string;

  @ApiProperty({
    description: "The Part's Category.",
    enum: Category.keys(),
    example: 'cpu',
  })
  readonly category: string;

  @ApiProperty({ description: "The Part's name.", example: 'AMD Ryzen 5 7600' })
  readonly name: string;

  @ApiProperty({ description: "The Part's manufacturer.", example: 'AMD' })
  readonly manufacturer: string;

  @ApiProperty({
    description: "The manufacturer's part numbers.",
    type: [String],
    example: ['100-100001015BOX'],
  })
  readonly partNumbers: string[];

  private constructor(
    id: string,
    category: string,
    name: string,
    manufacturer: string,
    partNumbers: string[],
  ) {
    this.id = id;
    this.category = category;
    this.name = name;
    this.manufacturer = manufacturer;
    this.partNumbers = partNumbers;
  }

  static of(part: Part): PartSummaryResponse {
    return new PartSummaryResponse(
      part.getId(),
      part.getCategory().getKey(),
      part.getName(),
      part.getManufacturer(),
      [...part.getPartNumbers()],
    );
  }
}
