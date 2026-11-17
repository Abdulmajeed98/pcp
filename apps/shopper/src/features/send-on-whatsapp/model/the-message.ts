import { type Language, shopperMessages } from '@pcp/i18n';
import { whatsAppChatWith } from '@pcp/links';
import { createTranslator } from 'next-intl';

// The message "send on WhatsApp" writes into the Shopper's chat with a
// Vendor (DESIGN.md's The WhatsApp message, the owner's choice of 17
// November 2026, SHR-5): one sentence in the page's language naming the
// Vendor as it wrote its name, the platform named by the name slot's words,
// so that the Vendor reads in its own chat where the Shopper came from; then
// the Shared Build's link on a line of its own. It names no price, so that a
// chat the Vendor keeps never shows a price that has since changed, and no
// city. The name is handed to the sentence as it is, never read as words of
// the message, and no invisible direction mark is put around it, since some
// phones draw one as a box: the message takes its direction from its first
// word, and the name keeps its own inside it.
export function theMessage(language: Language, vendorName: string, link: string): string {
  const t = createTranslator({ locale: language, messages: shopperMessages[language] });
  return `${t('BuildPage.send.message', { vendor: vendorName, site: t('Site.name') })}\n${link}`;
}

// The chat a tap on "send on WhatsApp" opens in its new tab: WhatsApp's chat
// with the number the Referral answered, written by `@pcp/links`, as every
// link out to WhatsApp is, with the message written in it.
export function chatWithTheVendor(
  language: Language,
  vendor: { name: string; whatsAppNumber: { international: string } },
  link: string,
): string {
  return whatsAppChatWith(
    vendor.whatsAppNumber.international,
    theMessage(language, vendor.name, link),
  );
}
