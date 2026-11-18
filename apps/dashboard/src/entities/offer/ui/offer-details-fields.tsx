import { AlwaysEnglish } from '@pcp/ui';
import type { ComponentProps, ReactNode } from 'react';
import { Controller, type FieldErrors, useFormContext } from 'react-hook-form';

import { Trans, useTranslation } from '@/shared/i18n';
import { describedBy } from '@/shared/lib';
import {
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

import type { OfferDetailRefusal } from '../model/detail-refusals';
import { numberIn, type OfferDetailsTyped } from '../model/details-typed';

// The fields of an Offer's details, in the Vendor portal's language, as the
// Offer form draws them and the Part Request form draws them too, so that a
// request asks for the Offer the Vendor would make exactly as an Offer does:
// its prices, in USD, in IQD or both, each on its own row under one legend;
// whether it is in stock, which starts on; and its warranty in months, which
// is optional. Each limit and the way a price is written are said below its
// field.
//
// They belong to the form around them, which holds the four details under
// their own names and gives itself through React Hook Form's
// `FormProvider`. Each field's identifier starts with `idPrefix`, so that a
// screen can tell one form's from another's.
//
// The prices and the warranty are typed as the Vendor's keyboard writes them:
// Arabic-Indic and Eastern Arabic-Indic digits become Western ones, and
// thousands separators and spaces are dropped, before they are sent
// (`offerDetailsOf`). The IQD price and the warranty are sent as numbers, so
// the fields say themselves when what is typed is not one. A refusal set on
// a field is said below it, in the portal's language.
export function OfferDetailsFields({ idPrefix }: { idPrefix: string }) {
  const { t } = useTranslation();
  const { register, control, formState } = useFormContext<OfferDetailsTyped>();
  const { errors } = formState;
  const aNumber = (detail: 'iqdPrice' | 'warrantyMonths') => ({
    validate: (typed: string) =>
      numberIn(typed) !== undefined ||
      (`${detail}.notANumber` satisfies OfferDetailRefusal),
  });

  return (
    <>
      <FieldSet>
        <FieldLegend>{t('OfferForm.prices')}</FieldLegend>
        <FieldDescription className="-mt-3">
          {t('OfferForm.pricesDescription')}
        </FieldDescription>
        <FieldGroup className="gap-4">
          <DetailField
            idPrefix={idPrefix}
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
            idPrefix={idPrefix}
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
                id={`${idPrefix}-inStock`}
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                aria-describedby={`${idPrefix}-inStock-description ${idPrefix}-inStock-error`}
                aria-invalid={errors.inStock !== undefined}
              />
            </label>
            <FieldDescription id={`${idPrefix}-inStock-description`} className="-mt-1">
              {t('OfferForm.inStockDescription')}
            </FieldDescription>
            <FieldError id={`${idPrefix}-inStock-error`}>
              {errors.inStock?.message === undefined ? undefined : (
                <RefusalText message={errors.inStock.message} />
              )}
            </FieldError>
          </Field>
        )}
      />

      <DetailField
        idPrefix={idPrefix}
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
    </>
  );
}

// A refusal's sentence, in the language the portal is shown in. A limit is
// not named: the API holds the limits and says only that one was passed, so
// no copy of them is kept here to fall out of step.
function RefusalText({ message }: { message: string }) {
  const { t } = useTranslation();
  return <>{t(`OfferForm.refused.${message as OfferDetailRefusal}`)}</>;
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
  idPrefix,
  name,
  label,
  optional = false,
  description,
  errors,
  children,
}: {
  idPrefix: string;
  name: 'usdPrice' | 'iqdPrice' | 'warrantyMonths';
  label: string;
  optional?: boolean;
  description: ReactNode;
  errors: FieldErrors<OfferDetailsTyped>;
  children: (props: ControlProps) => ReactNode;
}) {
  const { t } = useTranslation();
  const id = `${idPrefix}-${name}`;
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
