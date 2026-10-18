import type { Language } from '@pcp/i18n';

import { t } from '@/shared/i18n';

// What the Vendor is handed over: where to log in, and what with.
export interface LoginDetails {
  // The address the dashboard is served from.
  portalAddress: string;
  // The login phone number in Iraq's own form, as a person reads it.
  loginPhoneNumber: string;
  temporaryPassword: string;
}

// The message the Admin sends the Vendor, in the language the Admin chose:
// a greeting, the dashboard's address, the login phone number and the
// temporary password, each after its label on a line of its own, so that a
// value reads whole inside Kurdish or Arabic text, and a sentence that the
// Vendor will choose its own password. A label is a message of its own, and
// its value is put after it here, so that no message holds a value.
export function handOverMessage(language: Language, details: LoginDetails): string {
  const lng = language;

  return [
    t('HandOver.greeting', { lng }),
    `${t('HandOver.portalAddress', { lng })} ${details.portalAddress}`,
    `${t('HandOver.loginPhoneNumber', { lng })} ${details.loginPhoneNumber}`,
    `${t('HandOver.temporaryPassword', { lng })} ${details.temporaryPassword}`,
    t('HandOver.choosePassword', { lng }),
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
