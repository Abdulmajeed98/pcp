import { ApiProperty } from '@nestjs/swagger';

import { Category } from '~/domain/part/Category';
import { Part } from '~/domain/part/Part';

import { photoPathOf } from '~/infrastructure/photo/endpoints/photo-path';
import type { SpecificationDocument } from '~/domain/specification/specification-document';

export class PartResponse {
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
    description: "The Part's identifier in OpenDB, or null for a Part the Admin created.",
    type: String,
    nullable: true,
    example: null,
  })
  readonly openDbId: string | null;

  @ApiProperty({
    description:
      "The Part's specifications, in OpenDB's field names and nesting. Its Category's specification list says what they may hold.",
    type: 'object',
    additionalProperties: true,
    example: { socket: 'AM5', specifications: { tdp: 65, memory: { types: ['DDR5'] } } },
  })
  readonly specifications: SpecificationDocument;

  @ApiProperty({
    description:
      "The paths of the specifications a Compatibility Rule reads that the Part lacks, in its list's order.",
    type: [String],
    example: ['specifications.tdp'],
  })
  readonly missingNeededSpecifications: string[];

  @ApiProperty({
    description: "The address of the Part's photo on this API, or null when it has none.",
    type: String,
    nullable: true,
    example: '/v1/photos/9d2b6c1e-0f3a-4b7d-8e5c-1a2b3c4d5e6f',
  })
  readonly photoPath: string | null;

  @ApiProperty({ description: 'When the Part was created.', format: 'date-time' })
  readonly createdAt: string;

  @ApiProperty({ description: 'When the Part last changed.', format: 'date-time' })
  readonly updatedAt: string;

  private constructor(part: Part) {
    this.id = part.getId();
    this.category = part.getCategory().getKey();
    this.name = part.getName();
    this.manufacturer = part.getManufacturer();
    this.partNumbers = [...part.getPartNumbers()];
    this.openDbId = part.getOpenDbId();
    this.specifications = part.getSpecifications();
    this.missingNeededSpecifications = part.getMissingNeededSpecifications();
    this.createdAt = part.getCreatedAt().toISOString();
    this.updatedAt = part.getUpdatedAt().toISOString();
    this.photoPath = photoPathOf(part.getPhotoId());
  }

  static of(part: Part): PartResponse {
    return new PartResponse(part);
  }
}
