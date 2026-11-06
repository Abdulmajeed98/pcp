import { hasLocale } from 'next-intl';
import { NextResponse } from 'next/server';

import { routing } from '@/shared/i18n';
import { addressAfterChoosingScheme, isScheme, rememberScheme } from '@/shared/scheme';

// What the scheme switch asks for: its form is sent here, at
// `/<language>/scheme`, with the chosen scheme and the page the Shopper was
// on, as the part of its address after the language, its query with it.
//
// The answer writes the choice into the browser for a year, or forgets it
// when the device's scheme is chosen, and sends the Shopper back to that
// page, in the language of this address, which is the page's own. Which
// address that is, `addressAfterChoosingScheme` says. It is a redirect that
// the browser follows with a plain request for the page, which the server
// draws in the chosen scheme, so a reload does not send the form a second
// time. With script the page changes its colours in place and sends the
// same form, so that the server's answer still writes the choice down.
//
// A scheme that is none of the three is not written down, and the Shopper is
// sent back all the same.
export async function chooseScheme(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return new NextResponse(null, { status: 404 });
  }

  const form = await request.formData();
  const scheme = form.get('scheme');

  // A relative address, so that the Shopper returns to the host they asked,
  // whatever the server is known by behind it.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: addressAfterChoosingScheme(locale, form.get('page')) },
  });
  if (isScheme(scheme)) rememberScheme(response, scheme);

  return response;
}
