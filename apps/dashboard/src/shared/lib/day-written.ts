// A day as the dashboard writes it, "3 November 2026": in English, with
// Western digits, in the person's own time zone, as a Part's page writes the
// day it last changed and the Platform Rate the day it was set.
const day = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  numberingSystem: 'latn',
});

export function dayWritten(moment: Date | string): string {
  return day.format(new Date(moment));
}
