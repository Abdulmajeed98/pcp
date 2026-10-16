import { Either } from 'effect';
import parsePhoneNumberFromString from 'libphonenumber-js/max';

// Why a text was not taken as a phone number: it is not a valid Iraqi
// number, or it is one but not a mobile number where one is needed.
export type PhoneNumberRefusal = 'notIraqi' | 'notMobile';

// Arabic-Indic digits, ٠ to ٩, and Eastern Arabic-Indic digits, ۰ to ۹, as
// the Western digits they stand for.
function inWesternDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

// What people write between the digits of a phone number: spaces, dashes,
// dots and brackets.
const separators = /[\s\-‐-―.()]/g;

// A phone number in Iraq, kept in one form however it was typed.
export class PhoneNumber {
  private constructor(
    private readonly international: string,
    private readonly national: string,
    private readonly mobile: boolean,
  ) {}

  // Reads a phone number typed in any of the forms a person types one: in
  // Western, Arabic-Indic or Eastern Arabic-Indic digits, with spaces, dashes,
  // dots or brackets, starting with 0, with +964 or with 00964. It is read as
  // Iraqi unless it says otherwise, and refused unless it is a valid Iraqi
  // number.
  //
  // The library would read the other digits and skip the separators by
  // itself, and would also find a number inside other text. What is left
  // after this clean-up has to be digits alone, with an optional + before
  // them, so that only the forms above are taken.
  static read(text: string): Either.Either<PhoneNumber, PhoneNumberRefusal> {
    const cleaned = inWesternDigits(text).replace(separators, '');
    if (!/^\+?[0-9]+$/.test(cleaned)) return Either.left('notIraqi');

    const parsed = parsePhoneNumberFromString(cleaned, {
      defaultCountry: 'IQ',
      extract: false,
    });
    if (parsed === undefined || !parsed.isValid() || parsed.country !== 'IQ') {
      return Either.left('notIraqi');
    }

    return Either.right(
      new PhoneNumber(
        parsed.number,
        parsed.formatNational(),
        parsed.getType() === 'MOBILE',
      ),
    );
  }

  // Reads a phone number as `read` does, and refuses a landline.
  static readMobile(text: string): Either.Either<PhoneNumber, PhoneNumberRefusal> {
    return Either.flatMap(PhoneNumber.read(text), (phoneNumber) =>
      phoneNumber.isMobile()
        ? Either.right(phoneNumber)
        : Either.left('notMobile' as const),
    );
  }

  // The form a phone number is stored in and linked to, international and
  // with no spaces: +9647501234567.
  getInternational(): string {
    return this.international;
  }

  // The form a person reads, Iraq's own: 0750 123 4567.
  getNational(): string {
    return this.national;
  }

  isMobile(): boolean {
    return this.mobile;
  }
}
