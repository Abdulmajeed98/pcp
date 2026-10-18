import type { PhoneNumberResponse } from '@pcp/api-client';
import { type Language, languageNames, languages } from '@pcp/i18n';
import { ExternalLinkIcon, MessageCircleIcon } from 'lucide-react';
import { useState } from 'react';

import { buttonVariants, FieldLegend, FieldSet } from '@/shared/ui';

import { handOverMessage, whatsAppChatWith } from '../model/message';

// The hand-over, in the Admin console's English: the choice of the language
// the Vendor reads the message in, each language named in its own language
// and script as the Vendor portal's switch names them, Kurdish first and
// chosen, and one link that opens a WhatsApp chat with the login phone
// number, from the Admin's own WhatsApp, with the message written. The chat
// is with the login phone number, the person who logs in, and not with the
// WhatsApp number, which may be the Vendor's staff's. The platform sends
// nothing itself.
//
// The link opens in a new tab, so that this screen, which holds the
// temporary password, stays where it is.
export function HandOver({
  loginPhoneNumber,
  temporaryPassword,
}: {
  loginPhoneNumber: PhoneNumberResponse;
  temporaryPassword: string;
}) {
  const [language, setLanguage] = useState<Language>(languages[0]);
  const message = handOverMessage(language, {
    portalAddress: window.location.origin,
    loginPhoneNumber: loginPhoneNumber.national,
    temporaryPassword,
  });

  return (
    <section aria-labelledby="hand-over" className="flex flex-col gap-4">
      <h2 id="hand-over" className="text-base font-medium">
        Hand the login details over
      </h2>
      <FieldSet>
        <FieldLegend variant="label">Language of the message</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {languages.map((each) => (
            <label
              key={each}
              lang={each}
              className="flex min-h-control cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-3 has-checked:bg-secondary has-checked:font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
            >
              <input
                type="radio"
                name="message-language"
                value={each}
                checked={each === language}
                className="size-5 accent-foreground"
                onChange={() => setLanguage(each)}
              />
              {languageNames[each]}
            </label>
          ))}
        </div>
      </FieldSet>
      <a
        href={whatsAppChatWith(loginPhoneNumber.international, message)}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ className: 'self-start' })}
      >
        <MessageCircleIcon data-icon="inline-start" aria-hidden="true" />
        Open the chat in WhatsApp
        <span className="sr-only">, in a new tab</span>
        <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
      </a>
    </section>
  );
}
