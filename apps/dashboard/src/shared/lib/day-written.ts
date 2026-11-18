// A day as the dashboard writes it, "3 November 2026": in English, with
// Western digits.
const written = { dateStyle: 'long', numberingSystem: 'latn' } as const;

// The day of a moment, in the person's own time zone, as a Part's page
// writes the day it last changed and the Platform Rate the day it was set.
const day = new Intl.DateTimeFormat('en-GB', written);

export function dayWritten(moment: Date | string): string {
  return day.format(new Date(moment));
}

// A day the API gives as a date, such as a Part Request's `sentOn`, the day
// in Iraq's time: the date it is, whatever the person's own time zone.
const date = new Intl.DateTimeFormat('en-GB', { ...written, timeZone: 'UTC' });

export function dateWritten(given: string): string {
  return date.format(new Date(`${given}T00:00:00Z`));
}
