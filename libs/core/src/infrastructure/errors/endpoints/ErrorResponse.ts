import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// One thing that went wrong. `title` and `detail` are keys for the frontends
// to turn into text, and never text written for a person. When there is more
// a frontend can act on, such as the field a refusal is about, it is in
// `additionalInformation`, as fixed keys and values.
export class SubErrorResponse {
  @ApiProperty({
    description: 'What went wrong, as a fixed code.',
    example: 'ACCESS_DENIED',
  })
  readonly code: string;

  @ApiProperty({
    description: 'The key of a short text for the error.',
    example: 'access_denied_title',
  })
  readonly title: string;

  @ApiProperty({
    description: 'The key of a longer text for the error.',
    example: 'access_denied_details',
  })
  readonly detail: string;

  @ApiPropertyOptional({
    description: 'Fixed keys and values about the error, such as the field it is about.',
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { field: 'manufacturer' },
  })
  readonly additionalInformation?: Readonly<Record<string, string>>;

  constructor(
    code: string,
    title: string,
    detail: string,
    additionalInformation?: Readonly<Record<string, string>>,
  ) {
    this.code = code;
    this.title = title;
    this.detail = detail;
    if (additionalInformation && Object.keys(additionalInformation).length > 0) {
      this.additionalInformation = additionalInformation;
    }
  }
}

// The body of every error the API answers.
export class ErrorResponse {
  @ApiProperty({ type: [SubErrorResponse] })
  readonly errors: SubErrorResponse[];

  constructor(errors: SubErrorResponse[]) {
    this.errors = errors;
  }
}
