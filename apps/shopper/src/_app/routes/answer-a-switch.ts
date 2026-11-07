import type { Language } from '@pcp/i18n';
import { hasLocale } from 'next-intl';
import { NextResponse } from 'next/server';

import { routing } from '@/shared/i18n';

// A switch of the frame whose choice the server writes down: what its form
// sends, under which name, which values are its choices, the address it
// returns the Shopper to, and how the choice is written into the answer.
interface ASwitch<Choice extends string> {
  field: string;
  isChoice: (value: unknown) => value is Choice;
  addressAfter: (language: Language, page: unknown) => string;
  remember: (response: NextResponse, choice: Choice) => void;
}

// What a switch's form asks for: its form is sent to the switch's address
// under `/<language>/`, with the choice and the page the Shopper was on, as
// the part of its address after the language, its query with it.
//
// The answer writes the choice into the browser and sends the Shopper back
// to that page, in the language of this address, which is the page's own;
// which address that is, the switch says. It is a redirect that the browser
// follows with a plain request for the page, which the server draws anew in
// the choice, so the switch works before any script has loaded and a reload
// does not send the form a second time. The address is relative, so that
// the Shopper returns to the host they asked, whatever the server is known
// by behind it. A choice that is none of the switch's is not written down,
// and the Shopper is sent back all the same; an address in no language the
// Shopper app knows answers 404.
export function answerTheSwitch<Choice extends string>({
  field,
  isChoice,
  addressAfter,
  remember,
}: ASwitch<Choice>) {
  return async function answer(
    request: Request,
    { params }: { params: Promise<{ locale: string }> },
  ): Promise<Response> {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
      return new NextResponse(null, { status: 404 });
    }

    const form = await request.formData();
    const choice = form.get(field);
    const response = new NextResponse(null, {
      status: 303,
      headers: { Location: addressAfter(locale, form.get('page')) },
    });
    if (isChoice(choice)) remember(response, choice);

    return response;
  };
}
