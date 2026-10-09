import { ApiProperty } from '@nestjs/swagger';

export class StatusResponse {
  @ApiProperty({
    description: 'The time this API process started.',
    format: 'date-time',
    example: '2026-10-09T14:53:40.719Z',
  })
  readonly startedAt: string;

  private constructor(startedAt: string) {
    this.startedAt = startedAt;
  }

  static of(startedAt: Date): StatusResponse {
    return new StatusResponse(startedAt.toISOString());
  }
}
