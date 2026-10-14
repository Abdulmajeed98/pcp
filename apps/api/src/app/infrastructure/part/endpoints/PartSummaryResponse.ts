import { ApiProperty } from '@nestjs/swagger';

import { Category } from '~/domain/part/Category';
import { Part } from '~/domain/part/Part';

import { photoPathOf } from '~/infrastructure/photo/endpoints/photo-path';

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

  @ApiProperty({
    description: "The address of the Part's photo on this API, or null when it has none.",
    type: String,
    nullable: true,
    example: '/v1/photos/9d2b6c1e-0f3a-4b7d-8e5c-1a2b3c4d5e6f',
  })
  readonly photoPath: string | null;

  private constructor(part: Part) {
    this.id = part.getId();
    this.category = part.getCategory().getKey();
    this.name = part.getName();
    this.manufacturer = part.getManufacturer();
    this.partNumbers = [...part.getPartNumbers()];
    this.photoPath = photoPathOf(part.getPhotoId());
  }

  static of(part: Part): PartSummaryResponse {
    return new PartSummaryResponse(part);
  }
}
