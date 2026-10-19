import { ApiProperty } from '@nestjs/swagger';

import { Specification } from '~/domain/specification/Specification';

// A needed specification a Part lacks.
export class MissingSpecificationResponse {
  @ApiProperty({
    description:
      "The specification's path in a Part's specifications, as the Part's missing needed specifications name it.",
    example: 'specifications.tdp',
  })
  readonly path: string;

  @ApiProperty({ description: "The specification's label, in English.", example: 'TDP' })
  readonly label: string;

  private constructor(specification: Specification) {
    this.path = specification.getPath();
    this.label = specification.getLabel();
  }

  static of(specification: Specification): MissingSpecificationResponse {
    return new MissingSpecificationResponse(specification);
  }
}
