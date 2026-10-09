export class StatusResponse {
  readonly startedAt: string;

  private constructor(startedAt: string) {
    this.startedAt = startedAt;
  }

  static of(startedAt: Date): StatusResponse {
    return new StatusResponse(startedAt.toISOString());
  }
}
