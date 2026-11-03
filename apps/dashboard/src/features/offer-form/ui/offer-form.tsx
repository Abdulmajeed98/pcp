import type { EditOfferRequest, PartSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { type ComponentProps, type ReactNode, useState } from 'react';
import { Controller, type FieldErrors, useForm } from 'react-hook-form';

import {
  Refusal,
  setRefusalsBesideTheirFields,
  WhyNotAnsweredInThePortal,
} from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import { describedBy, useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  BusyLabel,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  OpeningSpace,
  OptionalMark,
  Switch,
} from '@/shared/ui';

import {
  newOfferFormValues,
  numberIn,
  offerDetailsOf,
  type OfferFormValues,
} from '../model/form-values';
import { refusalOf, type RefusalMessage } from '../model/refusals';
import { OfferedPart } from './offered-part';
import { PartBeside } from './part-beside';

// The form in which a Vendor gives its Offer for a Part, in the Vendor
// portal's language: the Part at its head, then its prices, in USD, in IQD or
// both, whether it is in stock, which starts on, and its warranty in months,
// which is optional. Each limit and the way a price is written are said
// below its field.
//
// The prices and the warranty are typed as the Vendor's keyboard writes them:
// Arabic-Indic and Eastern Arabic-Indic digits become Western ones, and
// thousands separators and spaces are dropped, before they are sent. A
// refusal from the API is shown beside the detail it names, in the portal's
// language, and that detail takes the focus. A refusal that names no detail,
// such as a second Offer for the Part, or an API that cannot be reached, is
// said just above the button.
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
  values = newOfferFormValues,
  purpose = 'add',
  save,
  after,
}: {
  part: PartSummaryResponse;
  // What the form starts with.
  values?: OfferFormValues;
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
  const { register, control, handleSubmit, setError, formState } = useForm<OfferFormValues>(
    { defaultValues: values },
  );
  const { errors } = formState;
  // Why the Offer was not saved, when the form says it above itself.
  const [notSaved, setNotSaved] = useState<{ why: unknown } | undefined>(undefined);
  // The IQD price and the warranty are sent as numbers, so the form says
  // itself when what is typed is not one.
  const aNumber = (detail: 'iqdPrice' | 'warrantyMonths') => ({
    validate: (typed: string) =>
      numberIn(typed) !== undefined || (`${detail}.notANumber` satisfies RefusalMessage),
  });

  async function submit(typed: OfferFormValues): Promise<void> {
    setNotSaved(undefined);
    try {
      await save(offerDetailsOf(typed));
    } catch (error) {
      if (!setRefusalsBesideTheirFields(error, setError, refusalOf)) {
        setNotSaved({ why: error });
      }
    }
  }

  const form = (
    <form
      noValidate
      data-testid="offer-form"
      className="flex w-full max-w-[40rem] flex-col gap-6"
      onSubmit={handleSubmit(submit)}
    >
      {!wide && <OfferedPart part={part} />}

      <FieldSet>
        <FieldLegend>{t('OfferForm.prices')}</FieldLegend>
        <FieldDescription className="-mt-3">
          {t('OfferForm.pricesDescription')}
        </FieldDescription>
        <FieldGroup className="gap-4">
          <DetailField
            name="usdPrice"
            label={t('OfferForm.usdPrice')}
            errors={errors}
            description={
              <Trans
                i18nKey="OfferForm.usdPriceDescription"
                components={{ example: <AlwaysEnglish>349.99</AlwaysEnglish> }}
              />
            }
          >
            {(props) => (
              <NumberInput {...props} inputMode="decimal" {...register('usdPrice')} />
            )}
          </DetailField>
          <DetailField
            name="iqdPrice"
            label={t('OfferForm.iqdPrice')}
            errors={errors}
            description={
              <Trans
                i18nKey="OfferForm.iqdPriceDescription"
                components={{ example: <AlwaysEnglish>525,000</AlwaysEnglish> }}
              />
            }
          >
            {(props) => (
              <NumberInput
                {...props}
                inputMode="numeric"
                {...register('iqdPrice', aNumber('iqdPrice'))}
              />
            )}
          </DetailField>
        </FieldGroup>
      </FieldSet>

      <Controller
        control={control}
        name="inStock"
        render={({ field }) => (
          <Field>
            <label className="flex min-h-control items-center justify-between gap-4 text-sm font-medium">
              {t('OfferForm.inStock')}
              <Switch
                id="offer-form-inStock"
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                aria-describedby="offer-form-inStock-description offer-form-inStock-error"
                aria-invalid={errors.inStock !== undefined}
              />
            </label>
            <FieldDescription id="offer-form-inStock-description" className="-mt-1">
              {t('OfferForm.inStockDescription')}
            </FieldDescription>
            <FieldError id="offer-form-inStock-error">
              {errors.inStock?.message === undefined ? undefined : (
                <RefusalText message={errors.inStock.message} />
              )}
            </FieldError>
          </Field>
        )}
      />

      <DetailField
        name="warrantyMonths"
        label={t('OfferForm.warranty')}
        optional
        errors={errors}
        description={t('OfferForm.warrantyDescription')}
      >
        {(props) => (
          <NumberInput
            {...props}
            inputMode="numeric"
            {...register('warrantyMonths', aNumber('warrantyMonths'))}
          />
        )}
      </DetailField>

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
        {form}
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

// A refusal's sentence, in the language the portal is shown in. A limit is
// not named: the API holds the limits and says only that one was passed, so
// no copy of them is kept here to fall out of step.
function RefusalText({ message }: { message: string }) {
  const { t } = useTranslation();
  return <>{t(`OfferForm.refused.${message as RefusalMessage}`)}</>;
}

// What a control of the form is given to name its field and its state.
interface ControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

// One detail of the Offer: its label, marked when it is optional, its
// control, what the form says about it, and its refusal, said in the
// language the portal is shown in, all of which the control names as its
// description.
function DetailField({
  name,
  label,
  optional = false,
  description,
  errors,
  children,
}: {
  name: 'usdPrice' | 'iqdPrice' | 'warrantyMonths';
  label: string;
  optional?: boolean;
  description: ReactNode;
  errors: FieldErrors<OfferFormValues>;
  children: (props: ControlProps) => ReactNode;
}) {
  const { t } = useTranslation();
  const id = `offer-form-${name}`;
  const refusal = errors[name]?.message;

  return (
    <Field data-testid={`${name}-field`}>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {optional && (
          <OptionalMark id={`${id}-optional`}>{t('OfferForm.optional')}</OptionalMark>
        )}
      </div>
      {children({
        id,
        'aria-invalid': refusal !== undefined,
        'aria-describedby': describedBy(
          optional && `${id}-optional`,
          `${id}-description`,
          refusal !== undefined && `${id}-error`,
        ),
      })}
      <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      <FieldError id={`${id}-error`}>
        {refusal === undefined ? undefined : <RefusalText message={refusal} />}
      </FieldError>
    </Field>
  );
}

// A number's control: a phone's keyboard for numbers, left to right, as a
// number is written in every language, and nothing the browser would fill.
function NumberInput(props: ControlProps & ComponentProps<'input'>) {
  return <Input type="text" dir="ltr" autoComplete="off" spellCheck={false} {...props} />;
}
