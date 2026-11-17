import {
  type APIRequestContext,
  type BrowserContext,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

import { vendorLineOf } from './build-page';
import { apiUrl } from './platform';

// "Send on WhatsApp" (sharing ticket 05). The chat is never opened. A route
// sees only the first request of a redirect, not the address it leads to
// (Playwright's `page.route`: "the handler will only be called for the
// first url if the response is a redirect"), so the test answers the form
// itself: it asks the Shopper app for the form's answer, reads the address
// the new tab is sent to, and answers the tab with a page of its own when
// that is WhatsApp's chat, so that nothing leaves the machine. A refusal,
// which sends the tab back to a page of the Shopper app, is answered as the
// Shopper app answers it.

// The two forms "send on WhatsApp" is sent with, from the Build page and
// from a Shared Build page.
const theSendForms =
  /^http:\/\/localhost:3000\/(ckb|ar|en)\/(build|builds\/[^/?#]+)\/send$/;

// WhatsApp's click-to-chat address, as `@pcp/links` writes it.
const whatsAppsChat = 'https://wa.me/';

// Answers every send in the context, and gives back the addresses of the
// chats the Shopper app sent its new tabs to, in their order, so that a test
// reads them and can tell that no chat was opened.
export async function answerWhatsAppsChatHere(context: BrowserContext): Promise<string[]> {
  const asked: string[] = [];
  await context.route(theSendForms, async (route) => {
    const answer = await route.fetch({ maxRedirects: 0 });
    const { location = '', ...headers } = answer.headers();
    if (!location.startsWith(whatsAppsChat)) return route.fulfill({ response: answer });
    asked.push(location);
    delete headers['content-length'];
    return route.fulfill({
      response: answer,
      status: 200,
      headers: { ...headers, 'content-type': 'text/html' },
      body: '<!doctype html><title>A chat answered by the test</title>',
    });
  });
  return asked;
}

// A Vendor's "send on WhatsApp" on its line of the second price view, and
// the form it is the button of.
export function sendButtonOf(page: Page, vendorId: string): Locator {
  return vendorLineOf(page, vendorId).getByTestId('send-on-whatsapp');
}

export function sendFormOf(page: Page, vendorId: string): Locator {
  return vendorLineOf(page, vendorId).getByTestId('send-form');
}

// What a send refused says, and a Vendor's line's words in the button's
// place when it gave no WhatsApp number.
export function sendRefused(page: Page): Locator {
  return page.getByTestId('send-refused');
}

export function noWhatsAppNumberOf(page: Page, vendorId: string): Locator {
  return vendorLineOf(page, vendorId).getByTestId('no-whatsapp-number');
}

// Taps "send on WhatsApp" for the Vendor, as a Shopper does, in a context
// whose sends `answerWhatsAppsChatHere` answers, and gives back the new tab
// it opens, once it is answered, with the address of the chat it was sent
// to, or none when the Shopper app sent it back to a page that says why.
export async function sendOnWhatsApp(
  page: Page,
  vendorId: string,
  asked: readonly string[],
): Promise<{ tab: Page; chat: string | undefined }> {
  const before = asked.length;
  const opened = page.waitForEvent('popup');
  await sendButtonOf(page, vendorId).click();
  const tab = await opened;
  await expect
    .poll(() => asked.length > before || !theSendForms.test(tab.url()), {
      message: 'the new tab is answered',
    })
    .toBe(true);
  await expect(tab).not.toHaveURL('about:blank');
  await tab.waitForLoadState('domcontentloaded');
  return { tab, chat: asked.length > before ? asked.at(-1) : undefined };
}

// The chat a new tab was sent to: the number it is with, its digits, and
// the message written in it, by its lines.
export function theChat(address: string | undefined): { number: string; lines: string[] } {
  expect(address, 'the tab was sent to WhatsApp’s chat').toBeDefined();
  const chat = new URL(address ?? '');
  expect(chat.origin).toBe('https://wa.me');
  return {
    number: chat.pathname.replace(/^\//, ''),
    lines: (chat.searchParams.get('text') ?? '').split('\n'),
  };
}

// A Vendor's WhatsApp number, as the API answers it to anyone, in the
// international form's digits, as a chat's address names it.
export async function whatsAppDigitsOf(
  request: APIRequestContext,
  vendorId: string,
): Promise<string> {
  const read = await request.get(`${apiUrl}/v1/visible-vendors/${vendorId}`);
  expect(read.status()).toBe(200);
  const { whatsAppNumber } = (await read.json()) as {
    whatsAppNumber: { international: string } | null;
  };
  expect(whatsAppNumber, 'the Vendor gave a WhatsApp number').not.toBeNull();
  return (whatsAppNumber as { international: string }).international.replace(/\D/g, '');
}
