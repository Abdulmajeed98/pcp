// Every number the platform shows is written by this one function, so that no
// screen can show digits of its own choosing (LANG-5). It writes Western
// digits, 0 to 9, with the thousands grouped by a comma and a point before
// the decimals, as in 1,575,000.5. It takes no language, because its answer
// is the same in all three, and the same on the server as in the browser.
//
// Neither next-intl's nor i18next's number formatting is used in its place.
// Each formats a number in the page's language. For Kurdish, Node then writes
// Arabic-Indic digits. Chromium has no number formatting for Kurdish at all,
// and uses the language the browser itself is set to: Arabic-Indic digits in
// a browser set to Arabic as written in Iraq, and French grouping in one set
// to French, also when the digits are pinned to Western ones. So the language
// is fixed here, and it is not the page's.
//
// It does not round. It writes the number it is given, and a screen that
// wants fewer decimals rounds first.
const western = new Intl.NumberFormat('en-US', {
  numberingSystem: 'latn',
  maximumFractionDigits: 20,
});

export function formatNumber(value: number): string {
  return western.format(value);
}
