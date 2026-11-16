import { ApiProperty } from '@nestjs/swagger';

import { SharedBuild } from '~/domain/shared-build/SharedBuild';
import { examplePartValues } from '~/infrastructure/build/endpoints/build-asked';

// A Shared Build: its frozen `part` values, which `GET v1/build` reads with
// today's prices and rules, and when it was shared.
export class SharedBuildResponse {
  @ApiProperty({
    description: "The Shared Build's identifier, a random UUID.",
    example: '7c1e2f3a-4b5d-4e6f-8a9b-0c1d2e3f4a5b',
  })
  readonly id: string;

  @ApiProperty({
    description: "When the Build was first shared, by the API's clock.",
    format: 'date-time',
  })
  readonly sharedAt: string;

  @ApiProperty({
    description:
      "The Build's Parts and quantities as they were shared, never changed since, as `GET v1/build` takes them in `part`: lower-case identifiers, in the catalog's order of Categories, then the Build's order for RAM kits and drives, each kit or drive followed by `:` and its quantity. A Part that has left the catalog since stays among them, and `GET v1/build` leaves it out.",
    type: [String],
    example: examplePartValues,
  })
  readonly part: string[];

  private constructor(sharedBuild: SharedBuild) {
    this.id = sharedBuild.getId();
    this.sharedAt = sharedBuild.getSharedAt().toISOString();
    this.part = [...sharedBuild.getPartValues()];
  }

  static of(sharedBuild: SharedBuild): SharedBuildResponse {
    return new SharedBuildResponse(sharedBuild);
  }
}
