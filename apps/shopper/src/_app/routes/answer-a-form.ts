import type { Language } from '@pcp/i18n';
import { hasLocale } from 'next-intl';
import { NextResponse } from 'next/server';

import { routing } from '@/shared/i18n';

// What the server does with a form of the frame or of the Build: the address
// it sends the Shopper to, in the language of the form's address, and what
// it writes into the browser, if anything.
export interface FormAnswered {
  address: string;
  write?: (response: NextResponse) => void;
}

// A form sent with POST to its address under `/<language>/`, a switch's or a
// change to the Build's, answered by the server alone: what it does with the
// form is written into the answer, which sends the Shopper on with a 303. The
// browser follows it with a plain request for the page, which the server
// draws anew, so the form works before any script has loaded and a reload
// does not send it a second time. The address is relative, so that the
// Shopper returns to the host they asked, whatever the server is known by
// behind it. An address in no language the Shopper app knows answers 404.
// A form whose address names something more, as a Shared Build's copy names
// the Shared Build, is handed what its address names besides the language.
export function answerAForm<Named extends Record<string, string> = Record<never, string>>(
  answered: (
    language: Language,
    form: FormData,
    named: Named,
  ) => FormAnswered | Promise<FormAnswered>,
) {
  return async function answer(
    request: Request,
    { params }: { params: Promise<{ locale: string } & Named> },
  ): Promise<Response> {
    const { locale, ...named } = await params;
    if (!hasLocale(routing.locales, locale)) {
      return new NextResponse(null, { status: 404 });
    }

    const { address, write } = await answered(
      locale,
      await request.formData(),
      named as unknown as Named,
    );
    const response = new NextResponse(null, {
      status: 303,
      headers: { Location: address },
    });
    write?.(response);
    return response;
  };
}
