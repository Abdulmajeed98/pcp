// A number as a Vendor's keyboard writes it, as the API reads it: Western
// digits and a point, and nothing between the digits.
//
// A Kurdish or an Arabic keyboard types Arabic-Indic digits, ٠ to ٩, or
// Eastern Arabic-Indic ones, ۰ to ۹, and its decimal separator, ٫, which
// become the Western digits and the point. A Vendor may group thousands with
// a comma, the Arabic thousands separator, ٬, the Arabic comma, ،, or a
// space of any width, and these are dropped. The API takes numbers in
// Western digits only, and says what is wrong with what is left.
const asWritten: Record<string, string> = { '٫': '.' };
for (let digit = 0; digit <= 9; digit++) {
  asWritten[String.fromCharCode(0x0660 + digit)] = String(digit);
  asWritten[String.fromCharCode(0x06f0 + digit)] = String(digit);
}

const grouping = /[,٬،\s]/gu;

export function westernNumberOf(typed: string): string {
  return typed
    .replace(/[٠-٩۰-۹٫]/g, (character) => asWritten[character] ?? character)
    .replace(grouping, '');
}
