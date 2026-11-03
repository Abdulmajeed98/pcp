import { ApiProperty } from '@nestjs/swagger';

import { Part } from '~/domain/part/Part';
import { PartSummaryResponse } from '~/infrastructure/part/endpoints/PartSummaryResponse';

import { LabelledSpecificationResponse } from './LabelledSpecificationResponse';

// A Visible Part as a Part page shows it to Shoppers: the Part as the
// catalog's lists show it, with its specifications labelled in English.
export class VisiblePartWithSpecificationsResponse extends PartSummaryResponse {
  @ApiProperty({
    description:
      'The specifications the Part holds, in the order of its Category\'s specification list, each with its English label and unit. One it lacks is left out, and so is a 0 where 0 stands for "not known".',
    type: [LabelledSpecificationResponse],
  })
  readonly specifications: LabelledSpecificationResponse[];

  private constructor(part: Part) {
    super(part);
    this.specifications = part
      .getLabelledSpecifications()
      .map(LabelledSpecificationResponse.of);
  }

  static override of(part: Part): VisiblePartWithSpecificationsResponse {
    return new VisiblePartWithSpecificationsResponse(part);
  }
}
