import type { EditOfferRequest, PartSummaryResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { type ComponentProps, type ReactNode, useState } from 'react';
import { Controller, type FieldErrors, useForm } from 'react-hook-form';

import {
  Refusal,
  setRefusalsBesideTheirFields,
  WhyNotAnsweredInThePortal,
} from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  OptionalMark,
  Switch,
} from '@/shared/ui';

import {
  newOfferFormValues,
  numberIn,
  offerDetailsOf,
  type OfferFormValues,
} from '../model/form-values';
import { largestIqdPrice, largestUsdPrice, longestWarrantyMonths } from '../model/limits';
import { refusalOf, type RefusalMessage } from '../model/refusals';
import { OfferedPart } from './offered-part';

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
// said above the form.
//
// The same form adds an Offer, starting empty and in stock, and changes one,
// starting with the Offer's details as they are; its button and what it says
// when the Offer is not saved follow which it does. Whatever else the screen
// offers, such as removing the Offer, the screen puts below it.
export function OfferForm({
  part,
  values = newOfferFormValues,
  purpose = 'add',
  save,
}: {
  part: PartSummaryResponse;
  // What the form starts with.
  values?: OfferFormValues;
  // Whether the form adds a new Offer or changes one.
  purpose?: 'add' | 'change';
  // Sends the Offer's details. It throws a `Refusal` when the API refuses
  // them, and an `Unreachable` when the API cannot be reached.
  save: (details: EditOfferRequest) => Promise<unknown>;
}) {
  const { t } = useTranslation();
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

  return (
    <form
      noValidate
      data-testid="offer-form"
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(submit)}
    >
      <OfferedPart part={part} />

      {notSaved !== undefined && <NotSaved why={notSaved.why} purpose={purpose} />}

      <FieldSet>
        <FieldLegend>{t('OfferForm.prices')}</FieldLegend>
        <FieldDescription className="-mt-3">
          {t('OfferForm.pricesDescription')}
        </FieldDescription>
        <FieldGroup className="grid items-start gap-4 sm:grid-cols-2">
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
            <label className="flex min-h-control items-center justify-between gap-4 font-medium">
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
        description={
          <Trans
            i18nKey="OfferForm.warrantyDescription"
            components={{ longest: <>{formatNumber(longestWarrantyMonths)}</> }}
          />
        }
      >
        {(props) => (
          <NumberInput
            {...props}
            inputMode="numeric"
            {...register('warrantyMonths', aNumber('warrantyMonths'))}
          />
        )}
      </DetailField>

      <Button
        type="submit"
        className="w-full sm:w-auto sm:self-start"
        disabled={formState.isSubmitting}
      >
        {purpose === 'add'
          ? formState.isSubmitting
            ? t('OfferForm.saving')
            : t('OfferForm.save')
          : formState.isSubmitting
            ? t('OfferForm.savingChanges')
            : t('OfferForm.saveChanges')}
      </Button>
    </form>
  );
}

// Why the Offer was not saved, above the form: a second Offer for the Part
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

// A refusal's sentence, in the language the portal is shown in, with the
// limit it names written by `formatNumber`.
function RefusalText({ message }: { message: string }) {
  return (
    <Trans
      i18nKey={`OfferForm.refused.${message as RefusalMessage}`}
      components={{
        largestUsd: <AlwaysEnglish>{`${formatNumber(largestUsdPrice)} $`}</AlwaysEnglish>,
        largestIqd: <AlwaysEnglish>{`${formatNumber(largestIqdPrice)} IQD`}</AlwaysEnglish>,
        longest: <>{formatNumber(longestWarrantyMonths)}</>,
      }}
    />
  );
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
  const describedBy = [
    optional && `${id}-optional`,
    `${id}-description`,
    refusal !== undefined && `${id}-error`,
  ].filter((each) => typeof each === 'string');

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
        'aria-describedby': describedBy.join(' '),
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
