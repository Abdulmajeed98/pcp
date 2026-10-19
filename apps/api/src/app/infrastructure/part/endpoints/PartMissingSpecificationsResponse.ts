import { ApiProperty } from '@nestjs/swagger';

import { Category } from '~/domain/part/Category';
import { PartMissingSpecifications } from '~/domain/part/PartMissingSpecifications';

import { photoPathOf } from '~/infrastructure/photo/endpoints/photo-path';

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

  @ApiProperty({
    description: "The address of the Part's photo on this API, or null when it has none.",
    type: String,
    nullable: true,
    example: '/v1/photos/9d2b6c1e-0f3a-4b7d-8e5c-1a2b3c4d5e6f',
  })
  readonly photoPath: string | null;

  private constructor(found: PartMissingSpecifications) {
    this.id = found.getPartId();
    this.category = found.getCategory().getKey();
    this.name = found.getName();
    this.manufacturer = found.getManufacturer();
    this.missingSpecifications = found.getMissing().map(MissingSpecificationResponse.of);
    this.offerCount = found.getOfferCount();
    this.photoPath = photoPathOf(found.getPhotoId());
  }

  static of(found: PartMissingSpecifications): PartMissingSpecificationsResponse {
    return new PartMissingSpecificationsResponse(found);
  }
}
