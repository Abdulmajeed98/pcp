import type { EditOfferRequest, PartSummaryResponse } from '@pcp/api-client';
import { cn } from 'cn';
import { type ReactNode, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import {
  newOfferDetailsTyped,
  OfferDetailsFields,
  offerDetailRefusalOf,
  offerDetailsOf,
  type OfferDetailsTyped,
} from '@/entities/offer';
import {
  Refusal,
  setRefusalsBesideTheirFields,
  WhyNotAnsweredInThePortal,
} from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  BusyLabel,
  Button,
  OpeningSpace,
} from '@/shared/ui';

import { OfferedPart } from './offered-part';
import { PartBeside } from './part-beside';

// The form in which a Vendor gives its Offer for a Part, in the Vendor
// portal's language: the Part at its head, then its prices, in USD, in IQD or
// both, whether it is in stock, which starts on, and its warranty in months,
// which is optional. Each limit and the way a price is written are said
// below its field.
//
// Its fields are the `offer` entity's (`OfferDetailsFields`), which the Part
// Request form draws too. The prices and the warranty are typed as the
// Vendor's keyboard writes them: Arabic-Indic and Eastern Arabic-Indic digits
// become Western ones, and thousands separators and spaces are dropped,
// before they are sent. A refusal from the API is shown beside the detail it
// names, in the portal's language, and that detail takes the focus. A
// refusal that names no detail, such as a second Offer for the Part, or an
// API that cannot be reached, is said just above the button.
//
// The same form adds an Offer, starting empty and in stock, and changes one,
// starting with the Offer's details as they are; its button and what it says
// when the Offer is not saved follow which it does. Whatever else the screen
// offers, such as removing the Offer, it gives as `after`, which stands below
// the form in the form's own column.
//
// As DESIGN.md's Offer form lays it out (redesign ticket 12): one column at
// every width, at most 40rem wide, each price on its own row; the Part at its
// head on a phone, and from 64rem beside it, on its end side, with its
// specifications (the owner's "Part beside form"); the refusal panel that
// names no field just above the button, where the Vendor's eye is after
// pressing it (the owner's "Above the button"), in an `OpeningSpace` whose
// space opens smoothly (the No Snap Rule); and the pane's one primary button
// last, as wide as the form on a phone, keeping its width while it waits
// (`BusyLabel`).
export function OfferForm({
  part,
  values = newOfferDetailsTyped,
  purpose = 'add',
  save,
  after,
}: {
  part: PartSummaryResponse;
  // What the form starts with.
  values?: OfferDetailsTyped;
  // Whether the form adds a new Offer or changes one.
  purpose?: 'add' | 'change';
  // Sends the Offer's details. It throws a `Refusal` when the API refuses
  // them, and an `Unreachable` when the API cannot be reached.
  save: (details: EditOfferRequest) => Promise<unknown>;
  // What the screen puts below the form, in its column.
  after?: ReactNode;
}) {
  const { t } = useTranslation();
  const wide = useWideScreen();
  const form = useForm<OfferDetailsTyped>({ defaultValues: values });
  const { handleSubmit, setError, formState } = form;
  // Why the Offer was not saved, when the form says it above itself.
  const [notSaved, setNotSaved] = useState<{ why: unknown } | undefined>(undefined);

  async function submit(typed: OfferDetailsTyped): Promise<void> {
    setNotSaved(undefined);
    try {
      await save(offerDetailsOf(typed));
    } catch (error) {
      if (!setRefusalsBesideTheirFields(error, setError, offerDetailRefusalOf)) {
        setNotSaved({ why: error });
      }
    }
  }

  const theForm = (
    <form
      noValidate
      data-testid="offer-form"
      className="flex w-full max-w-[40rem] flex-col gap-6"
      onSubmit={handleSubmit(submit)}
    >
      {!wide && <OfferedPart part={part} />}

      <OfferDetailsFields idPrefix="offer-form" />

      <OpeningSpace>
        {notSaved !== undefined && <NotSaved why={notSaved.why} purpose={purpose} />}
      </OpeningSpace>
      <Button
        type="submit"
        className="w-full sm:w-auto sm:self-start"
        disabled={formState.isSubmitting}
      >
        <BusyLabel
          busy={formState.isSubmitting}
          label={purpose === 'add' ? t('OfferForm.save') : t('OfferForm.saveChanges')}
          busyLabel={
            purpose === 'add' ? t('OfferForm.saving') : t('OfferForm.savingChanges')
          }
        />
      </Button>
    </form>
  );
  // The form's column stays where it is at every width, so that a window
  // crossing 64rem leaves the form as it is, with what is typed into it;
  // only the Part beside it comes and goes.
  return (
    <div
      className={cn(
        wide && 'grid grid-cols-[minmax(0,40rem)_minmax(16rem,1fr)] items-start gap-6',
      )}
    >
      <div className="flex w-full max-w-[40rem] min-w-0 flex-col gap-6">
        <FormProvider {...form}>{theForm}</FormProvider>
        {after}
      </div>
      {wide && <PartBeside part={part} />}
    </div>
  );
}

// Why the Offer was not saved, just above the button: a second Offer for the Part
// in words of its own, and any other refusal, or an API that cannot be
// reached, as the portal says it everywhere.
function NotSaved({ why, purpose }: { why: unknown; purpose: 'add' | 'change' }) {
  const { t } = useTranslation();
  const taken = why instanceof Refusal && why.reasonFor('partId') === 'taken';

  return (
    <Alert variant="destructive" data-testid="refusal">
      <AlertTitle>
        {purpose === 'add' ? t('OfferForm.notSaved') : t('OfferForm.notSavedChanges')}
      </AlertTitle>
      <AlertDescription>
        {taken ? t('OfferForm.taken') : <WhyNotAnsweredInThePortal error={why} />}
      </AlertDescription>
    </Alert>
  );
}
