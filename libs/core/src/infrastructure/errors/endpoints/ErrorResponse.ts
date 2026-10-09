import { ApiProperty } from '@nestjs/swagger';

// One thing that went wrong. `title` and `detail` are keys for the frontends
// to turn into text, and never text written for a person.
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

  constructor(code: string, title: string, detail: string) {
    this.code = code;
    this.title = title;
    this.detail = detail;
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
