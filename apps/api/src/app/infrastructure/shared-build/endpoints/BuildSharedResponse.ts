import { ApiProperty } from '@nestjs/swagger';

import { SharedBuild } from '~/domain/shared-build/SharedBuild';

// The Shared Build that holds a Build just shared: the one stored now, or the
// one an earlier share of the same Build stored.
export class BuildSharedResponse {
  @ApiProperty({
    description:
      "The Shared Build's identifier, a random UUID, which the Shared Build page's address names.",
    example: '7c1e2f3a-4b5d-4e6f-8a9b-0c1d2e3f4a5b',
  })
  readonly id: string;

  @ApiProperty({
    description: "When the Build was first shared, by the API's clock.",
    format: 'date-time',
  })
  readonly sharedAt: string;

  private constructor(sharedBuild: SharedBuild) {
    this.id = sharedBuild.getId();
    this.sharedAt = sharedBuild.getSharedAt().toISOString();
  }

  static of(sharedBuild: SharedBuild): BuildSharedResponse {
    return new BuildSharedResponse(sharedBuild);
  }
}
