import { hasLocale } from 'next-intl';
import { NextResponse } from 'next/server';

import {
  addressAfterChoosingCurrency,
  isCurrency,
  rememberCurrency,
} from '@/shared/currency';
import { routing } from '@/shared/i18n';

// What the currency switch asks for: its form is sent here, at
// `/<language>/currency`, with the chosen currency and the page the Shopper
// was on, as the part of its address after the language, its query with it.
//
// The answer writes the choice into the browser for a year and sends the
// Shopper back to that page, in the language of this address, which is the
// page's own, without a price range typed in the other currency. Which
// address that is, `addressAfterChoosingCurrency` says, and it alone. It is a
// redirect that the browser follows with a plain request for the page, so the
// page is drawn again in the chosen currency, and a reload does not send the
// form a second time.
//
// A currency that is neither of the two is not written down, and the Shopper
// is sent back all the same.
export async function chooseCurrency(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return new NextResponse(null, { status: 404 });
  }

  const form = await request.formData();
  const currency = form.get('currency');

  // A relative address, so that the Shopper returns to the host they asked,
  // whatever the server is known by behind it.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: addressAfterChoosingCurrency(locale, form.get('page')) },
  });
  if (isCurrency(currency)) rememberCurrency(response, currency);

  return response;
}
