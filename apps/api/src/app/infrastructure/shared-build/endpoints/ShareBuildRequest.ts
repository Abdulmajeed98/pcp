import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

import { ShareBuildCommandInput } from '~/domain/shared-build/ShareBuildCommand';
import {
  examplePartValues,
  whatEachPartValueIs,
} from '~/infrastructure/build/endpoints/build-asked';

// A Build to share, given as `GET v1/build` takes it in its query, as a list
// in the body.
export class ShareBuildRequest {
  @ApiProperty({
    description: `The Build to share, as \`GET v1/build\` takes it. ${whatEachPartValueIs} Also refused, naming \`part\`, with the reason \`empty\`, for a Build that holds no Part once those the catalog does not hold are left out.`,
    type: [String],
    example: examplePartValues,
  })
  @IsArray()
  @IsString({ each: true })
  readonly part!: string[];

  toCommandInput(): ShareBuildCommandInput {
    return new ShareBuildCommandInput(this.part);
  }
}
