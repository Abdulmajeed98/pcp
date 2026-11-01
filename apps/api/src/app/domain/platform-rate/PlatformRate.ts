import { NotValidError } from '@pcp/core';
import { Either } from 'effect';

import { platformRateRefused } from './platform-rate-errors';

// The lowest and the highest Platform Rate, in whole dinars per dollar. They
// catch a slipped digit, such as 157 or 15,750 for 1,575, and leave room for
// any rate the market has seen. They are checked here alone, and no frontend
// holds a copy.
export const lowestIqdPerUsd = 500;
export const highestIqdPerUsd = 5000;

// A rate as it was sent, any JSON value or none, as a whole number of dinars
// per dollar within the limits, or why it was refused.
export function checkIqdPerUsd(sent: unknown): Either.Either<number, NotValidError> {
  if (sent === undefined || sent === null)
    return Either.left(platformRateRefused('missing'));
  if (typeof sent !== 'number') return Either.left(platformRateRefused('notANumber'));
  if (!Number.isInteger(sent)) return Either.left(platformRateRefused('notWhole'));
  if (sent < lowestIqdPerUsd || sent > highestIqdPerUsd) {
    return Either.left(platformRateRefused('outOfRange'));
  }

  return Either.right(sent);
}

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
