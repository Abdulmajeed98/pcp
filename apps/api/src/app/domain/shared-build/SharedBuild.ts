import { calendarDaysBetween, theDayOf } from './the-platforms-day';

// A Shared Build: a frozen copy of a Build's Parts and quantities, stored by
// the platform behind a link, which never changes (SHR-1, SHR-3). It holds
// the Build's `part` values as `GET v1/build` takes them, and nothing about
// the Shopper who shared it.
export class SharedBuild {
  constructor(
    private readonly id: string,
    private readonly partValues: readonly string[],
    private readonly sharedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  // The frozen `part` values: lower-case identifiers, in the catalog's order
  // of Categories, then the Build's order for RAM kits and drives, each kit
  // or drive followed by `:` and its quantity. A Part that has left the
  // catalog since stays among them.
  getPartValues(): readonly string[] {
    return this.partValues;
  }

  // When it was first shared, by the API's clock.
  getSharedAt(): Date {
    return this.sharedAt;
  }

  // The day it was shared, in the platform's time, Iraq's: `2026-11-16`.
  getSharedOn(): string {
    return theDayOf(this.sharedAt);
  }

  // The calendar days, in the platform's time, from the day it was shared to
  // now's: 0 on that day, 1 on the next, whatever the hours between, so that
  // the count always agrees with the day it was shared (the owner's answer
  // of 17 November 2026 to sharing's code review).
  getDaysSinceShared(now: Date): number {
    return calendarDaysBetween(this.sharedAt, now);
  }
}
