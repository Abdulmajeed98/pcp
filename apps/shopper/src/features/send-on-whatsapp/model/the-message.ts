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
// the message. The message takes its direction from its first word, and the
// name keeps its own inside it, kept apart between a first-strong isolate
// and its end (U+2068 and U+2069), as `AsWritten` keeps a name apart on a
// page, since a message is plain text, where no `bdi` can go: without them
// a Latin name that ends in a stop or a mark, "Tech Co.", is drawn
// ".Tech Co" inside a Kurdish or Arabic sentence (sharing's code review).
// Both are invisible characters a renderer must not draw (Unicode's default
// ignorables, since 2013); how the WhatsApp app draws them is a check on a
// phone after hosting.
export function theMessage(language: Language, vendorName: string, link: string): string {
  const t = createTranslator({ locale: language, messages: shopperMessages[language] });
  const vendor = `\u2068${vendorName}\u2069`;
  return `${t('BuildPage.send.message', { vendor, site: t('Site.name') })}\n${link}`;
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
