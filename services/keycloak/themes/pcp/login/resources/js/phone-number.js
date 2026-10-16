// Turns what is typed in the login screen's name field into the form a
// Vendor's Login is named by, `+9647501234567`, just before the form is sent,
// when what is typed looks like a phone number. A Vendor may type its login
// phone number in whatever form its keyboard gives: in Arabic-Indic or
// Eastern Arabic-Indic digits, with spaces, dashes, dots or brackets, and
// starting with 0, 00964, 964 or +964. A name with a letter in it, such as
// the development Admin's, is left as it is.
//
// The theme's properties name this script, and Keycloak loads it in the head
// of each of its screens, before the form exists. So it listens on the whole
// document, for the login screen's form only.
//
// Its clean-up is the API's PhoneNumber's, the same digits and the same
// separators, and the two are kept alike. What follows differs. The API
// hands the cleaned digits to libphonenumber-js, which reads a leading 0,
// 00964, 964 or +964, and also a number typed with no leading 0, such as
// 750 123 4567, and checks that the number is valid. This script only turns
// the first four starts into +964, as the accounts spec lists them, and
// checks nothing: Keycloak finds no Login for anything else.

// Arabic-Indic digits, ٠ to ٩, and Eastern Arabic-Indic digits, ۰ to ۹, as
// the Western digits they stand for.
function inWesternDigits(text) {
  return text
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

// What people write between the digits of a phone number: spaces, dashes,
// dots and brackets.
const separators = /[\s\-‐-―.()]/g;

// What is typed, in the stored form when it looks like a phone number: digits
// alone once the separators are gone, with an optional + before them.
function inTheStoredForm(typed) {
  const cleaned = inWesternDigits(typed).replace(separators, '');
  if (!/^\+?[0-9]+$/.test(cleaned)) return typed;

  for (const start of ['00964', '964', '0']) {
    if (cleaned.startsWith(start)) return `+964${cleaned.slice(start.length)}`;
  }
  return cleaned;
}

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (form.id !== 'kc-form-login') return;

  const name = form.elements.namedItem('username');
  if (name !== null) name.value = inTheStoredForm(name.value);
});
