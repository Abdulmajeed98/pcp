import type { Language } from '@pcp/i18n';
import type { NextResponse } from 'next/server';

import { answerAForm } from './answer-a-form';

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
// which address that is, the switch says. A choice that is none of the
// switch's is not written down, and the Shopper is sent back all the same.
// `answerAForm` says how the answer is made.
export function answerTheSwitch<Choice extends string>({
  field,
  isChoice,
  addressAfter,
  remember,
}: ASwitch<Choice>) {
  return answerAForm((language, form) => {
    const choice = form.get(field);
    return {
      address: addressAfter(language, form.get('page')),
      write: isChoice(choice) ? (response) => remember(response, choice) : undefined,
    };
  });
}
