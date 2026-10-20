// The address that calls a phone number, from its international form, which
// is stored with no spaces (RFC 3966).
export function callTo(internationalNumber: string): string {
  return `tel:${internationalNumber}`;
}

// WhatsApp's click-to-chat address for a chat with a phone number: its digits
// in the international form, with no + (WhatsApp Help Center, "How to use
// click to chat"). The Admin writes the message in the chat.
export function chatTo(internationalNumber: string): string {
  return `https://wa.me/${internationalNumber.replace(/\D/g, '')}`;
}
