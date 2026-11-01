// The Platform Rate: the single number of IQD per USD that the Admin types
// in, which every Converted Price is derived from (PRC-1). The Admin follows
// the Erbil market rate by hand, and nothing fetches it from a service
// (ADR-0002).
export class PlatformRate {
  constructor(
    private readonly iqdPerUsd: number,
    private readonly setAt: Date,
  ) {}

  // Whole dinars per dollar.
  getIqdPerUsd(): number {
    return this.iqdPerUsd;
  }

  // When the Admin set it, by the API's clock.
  getSetAt(): Date {
    return this.setAt;
  }
}
