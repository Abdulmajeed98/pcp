import { directions, type Language } from '@pcp/i18n';

import { t } from '@/shared/i18n';

// What the Vendor is handed over: where to log in, and what with.
export interface LoginDetails {
  // The address the dashboard is served from.
  portalAddress: string;
  // The login phone number in Iraq's own form, as a person reads it.
  loginPhoneNumber: string;
  temporaryPassword: string;
}

// What stands before the phone number, after its label and the space. In a
// line laid out right to left, the spaces between the number's groups would
// take the line's direction, and "0750 123 4567" would be drawn "4567 123
// 0750". A left-to-right mark before the number makes its digits run left to
// right (Unicode's bidirectional algorithm, rule W7). It follows the space,
// so that the space stays between the label and the number: before it, the
// space would run with the number and leave the colon touching it. Word
// selection joins the mark to the space before it (Unicode's word
// boundaries, rule WB4), so a Vendor who selects the number does not copy
// the mark, which the login screen's script would not take off.
const numberMark = { rtl: '\u200E', ltr: '' } as const;

// The message the Admin sends the Vendor, in the language the Admin chose:
// a greeting, the dashboard's address, the login phone number and the
// temporary password, each after its label on a line of its own, so that a
// value reads whole inside Kurdish or Arabic text, and a sentence that the
// Vendor will choose its own password. A label is a message of its own, and
// its value is put after it here, so that no message holds a value.
export function handOverMessage(language: Language, details: LoginDetails): string {
  return [
    t('HandOver.greeting', { lng: language }),
    `${t('HandOver.portalAddress', { lng: language })} ${details.portalAddress}`,
    `${t('HandOver.loginPhoneNumber', { lng: language })} ${numberMark[directions[language]]}${details.loginPhoneNumber}`,
    `${t('HandOver.temporaryPassword', { lng: language })} ${details.temporaryPassword}`,
    t('HandOver.choosePassword', { lng: language }),
  ].join('\n');
}

// WhatsApp's click-to-chat address for a chat with a phone number, with a
// message written in it for the Admin to send. The number is its digits in
// the international form, with no + (WhatsApp Help Center, "How to use click
// to chat"), and the message is URL-encoded, a line break as %0A.
export function whatsAppChatWith(internationalNumber: string, message: string): string {
  const digits = internationalNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
