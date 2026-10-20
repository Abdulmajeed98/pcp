// Text as a Kurdish or an Arabic keyboard types it, with its digits and
// decimal separator as Western ones: Arabic-Indic digits, ٠ to ٩, and
// Eastern Arabic-Indic ones, ۰ to ۹, become 0 to 9, and the Arabic decimal
// separator, ٫, becomes a point. Everything else is left as it was, for the
// caller to read as it needs: an Offer's price drops its thousands
// separators, and a map location takes the Arabic comma as a comma.
const western: Record<string, string> = { '٫': '.' };
for (let digit = 0; digit <= 9; digit++) {
  western[String.fromCharCode(0x0660 + digit)] = String(digit);
  western[String.fromCharCode(0x06f0 + digit)] = String(digit);
}

export function westernDigitsIn(text: string): string {
  return text.replace(/[٠-٩۰-۹٫]/g, (character) => western[character] ?? character);
}
