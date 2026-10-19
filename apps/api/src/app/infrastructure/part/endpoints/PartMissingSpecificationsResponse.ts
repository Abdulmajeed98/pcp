import { ApiProperty } from '@nestjs/swagger';

import { Category } from '~/domain/part/Category';
import { PartMissingSpecifications } from '~/domain/part/PartMissingSpecifications';

import { MissingSpecificationResponse } from './MissingSpecificationResponse';

// A Part that has an Offer and lacks a needed specification.
export class PartMissingSpecificationsResponse {
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
    description:
      "The needed specifications the Part lacks, in its Category's list's order. Never empty.",
    type: [MissingSpecificationResponse],
  })
  readonly missingSpecifications: MissingSpecificationResponse[];

  @ApiProperty({
    description:
      'How many Offers the Part has, from any Vendor, Expired Offers among them.',
    example: 3,
  })
  readonly offerCount: number;

  private constructor(found: PartMissingSpecifications) {
    this.id = found.getPartId();
    this.category = found.getCategory().getKey();
    this.name = found.getName();
    this.manufacturer = found.getManufacturer();
    this.missingSpecifications = found.getMissing().map(MissingSpecificationResponse.of);
    this.offerCount = found.getOfferCount();
  }

  static of(found: PartMissingSpecifications): PartMissingSpecificationsResponse {
    return new PartMissingSpecificationsResponse(found);
  }
}
