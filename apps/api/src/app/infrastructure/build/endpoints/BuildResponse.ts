import { ApiProperty } from '@nestjs/swagger';

import { Build } from '~/domain/build/Build';

import { BuildPartResponse } from './BuildPartResponse';

// A Build as it is read: its Parts as the catalog holds them.
export class BuildResponse {
  @ApiProperty({
    description:
      "The Build's Parts that the catalog holds, in the catalog's order of Categories, and the RAM kits and drives in the order the Build gives them. A Part the catalog no longer holds is left out.",
    type: [BuildPartResponse],
  })
  readonly parts: BuildPartResponse[];

  private constructor(build: Build) {
    this.parts = build.getParts().map(BuildPartResponse.ofBuildPart);
  }

  static of(build: Build): BuildResponse {
    return new BuildResponse(build);
  }
}
