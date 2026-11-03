// WhatsApp's click-to-chat address for a chat with a phone number, with a
// message written in it when one is given. The number is its digits in the
// international form, with no + (WhatsApp Help Center, "How to use click to
// chat"), and the message is URL-encoded, a line break as %0A.
export function whatsAppChatWith(internationalNumber: string, message?: string): string {
  const chat = `https://wa.me/${internationalNumber.replace(/\D/g, '')}`;
  return message === undefined ? chat : `${chat}?text=${encodeURIComponent(message)}`;
}
