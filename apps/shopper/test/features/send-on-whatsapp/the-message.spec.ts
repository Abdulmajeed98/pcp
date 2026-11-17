import type { Language } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { chatWithTheVendor, theMessage } from '@/features/send-on-whatsapp';

const sharedBuildId = '3f6c1e9a-8b2d-4f71-9c5e-a04d7b2e91c3';
const linkIn = (language: Language) =>
  `http://localhost:3000/${language}/builds/${sharedBuildId}`;

// A Vendor's name as it wrote it: in Latin letters, in Kurdish, in Arabic,
// and with what a name may hold that a message's own words treat apart.
const names = [
  'Made-up PC Parts',
  'کۆگای ئەلیکترۆنیاتی خەیاڵی',
  'متجر التجربة للإلكترونيات',
  "Ali's {Parts} & Co.",
];

// The message "send on WhatsApp" writes into the chat (DESIGN.md's The
// WhatsApp message, the owner's choice of 17 November 2026): one sentence in
// the page's language naming the Vendor as it wrote its name, then the
// Shared Build's link on a line of its own, with no price and no city.
describe('the WhatsApp message', () => {
  it('is, in English, the sentence the owner chose, then the link', () => {
    expect(theMessage('en', 'Made-up PC Parts', linkIn('en'))).toBe(
      `Hello \u2068Made-up PC Parts\u2069, I planned this PC on PC Parts and Prices: do you have its Parts?\n${linkIn('en')}`,
    );
  });

  it('is, in Kurdish and in Arabic, the drafts for LANG-7, then the link', () => {
    expect(theMessage('ckb', 'Made-up PC Parts', linkIn('ckb'))).toBe(
      `سڵاو \u2068Made-up PC Parts\u2069، ئەم کۆمپیوتەرەم لە پارچە و نرخی کۆمپیوتەر داناوە: ئایا پارچەکانیتان هەیە؟\n${linkIn('ckb')}`,
    );
    expect(theMessage('ar', 'Made-up PC Parts', linkIn('ar'))).toBe(
      `مرحبًا \u2068Made-up PC Parts\u2069، خطّطت لهذا الحاسوب على قطع الحاسوب وأسعارها: هل لديكم قطعه؟\n${linkIn('ar')}`,
    );
  });

  describe.each<Language>(['ckb', 'ar', 'en'])('in %s', (language) => {
    it.each(names)('names the Vendor %j as it wrote its name, in one sentence', (name) => {
      const [sentence, ...rest] = theMessage(language, name, linkIn(language)).split('\n');
      expect(sentence).toContain(name);
      expect(rest).toEqual([linkIn(language)]);
    });

    // A message is plain text, where no `bdi` can go, so the name is kept
    // apart as `AsWritten` keeps it on a page: between a first-strong
    // isolate and its end (U+2068, U+2069), which takes its direction from
    // its own first letter. Without them a Latin name that ends in a stop
    // or a mark, "Tech Co." or "Ali & Sons!", is drawn ".Tech Co" inside a
    // Kurdish or Arabic sentence, as a chat app draws it.
    it.each(names)('keeps the Vendor %j apart, in its own direction', (name) => {
      const [sentence] = theMessage(language, name, linkIn(language)).split('\n');
      expect(sentence).toContain(`⁨${name}⁩`);
      expect(sentence.match(/[⁦-⁩]/g)).toEqual(['⁨', '⁩']);
    });

    it('holds the link in its language on a line of its own, last', () => {
      const lines = theMessage(language, 'Made-up PC Parts', linkIn(language)).split('\n');
      expect(lines).toHaveLength(2);
      expect(lines.at(-1)).toBe(linkIn(language));
    });

    it('names no price and no city', () => {
      const message = theMessage(language, 'Made-up PC Parts', linkIn(language));
      // The words around the link: a price would need a figure or a unit.
      const words = message.replace(linkIn(language), '');
      expect(words).not.toMatch(/IQD|\$|≈|د\.ع|دینار|دينار|دۆلار|دولار/);
      expect(words).not.toMatch(/[0-9٠-٩۰-۹]/);
      expect(message).not.toMatch(/Erbil|هەولێر|أربيل/);
    });
  });

  it('differs in each language', () => {
    const messages = (['ckb', 'ar', 'en'] as const).map((language) =>
      theMessage(language, 'Made-up PC Parts', linkIn('en')),
    );
    expect(new Set(messages).size).toBe(3);
  });
});

// The chat "send on WhatsApp" opens: WhatsApp's chat with the number the
// Referral answered, as `@pcp/links` writes it, with the message written in.
describe("the chat's address", () => {
  it('is WhatsApp’s chat with the Vendor’s number, the message written in it', () => {
    const address = new URL(
      chatWithTheVendor(
        'ar',
        {
          id: '0b7f4c2e-9a31-4d58-8e6f-2c1a5d9b3e70',
          name: 'متجر التجربة للإلكترونيات',
          whatsAppNumber: { international: '+9647501234567', national: '0750 123 4567' },
        },
        linkIn('ar'),
      ),
    );
    expect(`${address.origin}${address.pathname}`).toBe('https://wa.me/9647501234567');
    expect(address.searchParams.get('text')).toBe(
      theMessage('ar', 'متجر التجربة للإلكترونيات', linkIn('ar')),
    );
  });
});
