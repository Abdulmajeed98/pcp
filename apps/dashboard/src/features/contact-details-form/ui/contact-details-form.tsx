import type { EditContactDetailsRequest, VendorResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { type ReactNode, useState } from 'react';
import { type FieldErrors, useForm, type UseFormRegisterReturn } from 'react-hook-form';

import { longest, MapLocationField } from '@/entities/vendor';
import { Refusal, WhyNotAnsweredInThePortal } from '@/shared/api';
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
  Input,
  OptionalMark,
  Textarea,
} from '@/shared/ui';

import {
  type ContactDetailsFormValues,
  contactDetailsFormValuesOf,
  contactDetailsRequestOf,
} from '../model/form-values';
import { refusalOf } from '../model/refusals';

// The form in which a Vendor changes its contact details, in the Vendor
// portal's language, filled with them as they are: its address, its map
// location, its phone number, its WhatsApp number, its Instagram name and
// its opening hours, the optional ones marked so and each length limit said.
// Its name, its city and its login phone number are not in it, because only
// the Admin changes them (ACC-8). What the Vendor writes is laid out in its
// own direction as it is typed, and its phone numbers and Instagram name left
// to right.
//
// Saving sends the six details and nothing else. A refusal from the API is
// shown beside the detail it names, in the portal's language, and that
// detail takes the focus. A refusal that names no detail, or an API that
// cannot be reached, is said above the form.
export function ContactDetailsForm({
  vendor,
  save,
}: {
  vendor: VendorResponse;
  // Sends the contact details. It throws a `Refusal` when the API refuses
  // them, and an `Unreachable` when the API cannot be reached.
  save: (request: EditContactDetailsRequest) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const { register, control, handleSubmit, setError, formState } =
    useForm<ContactDetailsFormValues>({
      defaultValues: contactDetailsFormValuesOf(vendor),
    });
  const { errors } = formState;
  const [notSaved, setNotSaved] = useState<Error | undefined>(undefined);
  const required = (detail: 'address' | 'phoneNumber') => ({
    validate: (text: string) =>
      text.trim() !== '' || t(`ContactDetailsForm.refused.${detail}.missing`),
  });
  const upTo = (characters: number) => ({
    longest: <>{formatNumber(characters)}</>,
  });

  async function submit(values: ContactDetailsFormValues): Promise<void> {
    setNotSaved(undefined);
    try {
      await save(contactDetailsRequestOf(values));
    } catch (error) {
      showWhyNot(error as Error);
    }
  }

  function showWhyNot(error: Error): void {
    const onTheForm =
      error instanceof Refusal ? error.errors.flatMap((each) => refusalOf(each) ?? []) : [];
    for (const [index, { detail, message }] of onTheForm.entries()) {
      setError(
        detail,
        { message: t(`ContactDetailsForm.refused.${message}`) },
        { shouldFocus: index === 0 },
      );
    }
    if (onTheForm.length === 0) setNotSaved(error);
  }

  return (
    <form noValidate className="flex flex-col gap-8" onSubmit={handleSubmit(submit)}>
      {notSaved !== undefined && (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>{t('ContactDetailsForm.notSaved')}</AlertTitle>
          <AlertDescription>
            <WhyNotAnsweredInThePortal error={notSaved} />
          </AlertDescription>
        </Alert>
      )}

      <FieldGroup className="grid items-start sm:grid-cols-2 sm:gap-x-6">
        <DetailField
          name="address"
          label={t('ContactDetailsForm.address')}
          errors={errors}
          description={
            <Trans
              i18nKey="ContactDetailsForm.addressDescription"
              components={upTo(longest.address)}
            />
          }
          className="sm:col-span-2"
        >
          {(props) => (
            <Textarea dir="auto" {...props} {...register('address', required('address'))} />
          )}
        </DetailField>
        <div className="sm:col-span-2">
          <MapLocationField
            control={control}
            name="mapLocation"
            id="contact-details-mapLocation"
          />
        </div>
        <DetailField
          name="phoneNumber"
          label={t('ContactDetailsForm.phoneNumber')}
          errors={errors}
          description={
            <Trans
              i18nKey="ContactDetailsForm.phoneNumberDescription"
              components={{ example: <AlwaysEnglish>066 223 4567</AlwaysEnglish> }}
            />
          }
        >
          {(props) => (
            <PhoneInput
              {...props}
              registered={register('phoneNumber', required('phoneNumber'))}
            />
          )}
        </DetailField>
        <DetailField
          name="whatsAppNumber"
          label={t('ContactDetailsForm.whatsAppNumber')}
          optional
          errors={errors}
          description={t('ContactDetailsForm.whatsAppNumberDescription')}
        >
          {(props) => <PhoneInput {...props} registered={register('whatsAppNumber')} />}
        </DetailField>
        <DetailField
          name="instagramName"
          label={t('ContactDetailsForm.instagramName')}
          optional
          errors={errors}
          description={
            <Trans
              i18nKey="ContactDetailsForm.instagramNameDescription"
              components={upTo(longest.instagramName)}
            />
          }
        >
          {(props) => (
            <Input
              dir="ltr"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              {...props}
              {...register('instagramName')}
            />
          )}
        </DetailField>
        <DetailField
          name="openingHours"
          label={t('ContactDetailsForm.openingHours')}
          optional
          errors={errors}
          description={
            <Trans
              i18nKey="ContactDetailsForm.openingHoursDescription"
              components={upTo(longest.openingHours)}
            />
          }
          className="sm:col-span-2"
        >
          {(props) => <Textarea dir="auto" {...props} {...register('openingHours')} />}
        </DetailField>
      </FieldGroup>

      <Button type="submit" className="self-start" disabled={formState.isSubmitting}>
        {t('ContactDetailsForm.save')}
      </Button>
    </form>
  );
}

// What a control of the form is given to name its field and its state.
interface ControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

// One contact detail: its label, marked when it is optional, its control,
// what the form says about it, and its refusal, all of which the control
// names as its description.
function DetailField({
  name,
  label,
  optional = false,
  description,
  errors,
  className,
  children,
}: {
  name: keyof ContactDetailsFormValues;
  label: string;
  optional?: boolean;
  description: ReactNode;
  errors: FieldErrors<ContactDetailsFormValues>;
  className?: string;
  children: (props: ControlProps) => ReactNode;
}) {
  const { t } = useTranslation();
  const id = `contact-details-${name}`;
  const error = errors[name]?.message;
  const describedBy = [
    optional && `${id}-optional`,
    `${id}-description`,
    error !== undefined && `${id}-error`,
  ].filter((each) => typeof each === 'string');

  return (
    <Field className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {optional && (
          <OptionalMark id={`${id}-optional`}>
            {t('ContactDetailsForm.optional')}
          </OptionalMark>
        )}
      </div>
      {children({
        id,
        'aria-invalid': error !== undefined,
        'aria-describedby': describedBy.join(' '),
      })}
      <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}

// A phone number's control: a phone's own keyboard for numbers, and left to
// right, as a phone number is written in every language.
function PhoneInput({
  registered,
  ...props
}: ControlProps & { registered: UseFormRegisterReturn }) {
  return <Input type="tel" dir="ltr" autoComplete="off" {...props} {...registered} />;
}
