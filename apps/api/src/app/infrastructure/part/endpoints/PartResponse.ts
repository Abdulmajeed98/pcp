import { ApiProperty } from '@nestjs/swagger';

import { Category } from '~/domain/part/Category';
import { Part } from '~/domain/part/Part';

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
  readonly specifications: Record<string, unknown>;

  @ApiProperty({
    description:
      "The paths of the specifications a Compatibility Rule reads that the Part lacks, in its list's order.",
    type: [String],
    example: ['specifications.tdp'],
  })
  readonly missingNeededSpecifications: string[];

  private constructor(part: Part) {
    this.id = part.getId();
    this.category = part.getCategory().getKey();
    this.name = part.getName();
    this.manufacturer = part.getManufacturer();
    this.partNumbers = [...part.getPartNumbers()];
    this.openDbId = part.getOpenDbId();
    this.specifications = part.getSpecifications();
    this.missingNeededSpecifications = part.getMissingNeededSpecifications();
  }

  static of(part: Part): PartResponse {
    return new PartResponse(part);
  }
}
