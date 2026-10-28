import type { EditContactDetailsRequest, VendorResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { type ReactNode, useState } from 'react';
import { type FieldErrors, useForm, type UseFormRegisterReturn } from 'react-hook-form';

import { longest, MapLocationField } from '@/entities/vendor';
import { setRefusalsBesideTheirFields, WhyNotAnsweredInThePortal } from '@/shared/api';
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
  OpeningSpace,
  OptionalMark,
  Textarea,
} from '@/shared/ui';

import {
  type ContactDetailsFormValues,
  contactDetailsFormValuesOf,
  contactDetailsRequestOf,
} from '../model/form-values';
import { refusalOf, type RefusalMessage } from '../model/refusals';

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
  // Why the details were not saved, when the form says it above itself.
  const [notSaved, setNotSaved] = useState<{ why: unknown } | undefined>(undefined);
  // A refusal is kept as its message's key and said when it is drawn, so that
  // it follows the language switch.
  const required = (detail: 'address' | 'phoneNumber') => ({
    validate: (text: string) =>
      text.trim() !== '' || (`${detail}.missing` satisfies RefusalMessage),
  });
  const refusalText = (message: string) =>
    t(`ContactDetailsForm.refused.${message as RefusalMessage}`);
  const upTo = (characters: number) => ({
    longest: <>{formatNumber(characters)}</>,
  });

  async function submit(values: ContactDetailsFormValues): Promise<void> {
    setNotSaved(undefined);
    try {
      await save(contactDetailsRequestOf(values));
    } catch (error) {
      showWhyNot(error);
    }
  }

  function showWhyNot(error: unknown): void {
    if (!setRefusalsBesideTheirFields(error, setError, refusalOf)) {
      setNotSaved({ why: error });
    }
  }

  return (
    <form
      noValidate
      className="@container flex flex-col gap-8"
      onSubmit={handleSubmit(submit)}
    >
      {/* The refusal panel opens its room as it arrives, and closes it as it
          goes, so the form below it never jumps (the No Snap Rule, in the
          shared OpeningSpace of redesign ticket 08). */}
      <OpeningSpace>
        {notSaved !== undefined && (
          <Alert variant="destructive" data-testid="refusal">
            <AlertTitle>{t('ContactDetailsForm.notSaved')}</AlertTitle>
            <AlertDescription>
              <WhyNotAnsweredInThePortal error={notSaved.why} />
            </AlertDescription>
          </Alert>
        )}
      </OpeningSpace>

      {/* The form spans the sheet (the owner's "Full width", 28 October
          2026), and its details follow the form's own width, as the Part's
          and the Vendor's forms do: one to a row under 40rem, two to a row
          from 40rem, the address beside the map location, the phone number
          beside the WhatsApp number and the Instagram name beside the
          opening hours, so that none stretches across the sheet and none
          stands beside an empty half. */}
      <FieldGroup className="grid items-start @min-[40rem]:grid-cols-2 @min-[40rem]:gap-x-6">
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
        >
          {(props) => (
            <Textarea dir="auto" {...props} {...register('address', required('address'))} />
          )}
        </DetailField>
        <div>
          <MapLocationField
            control={control}
            name="mapLocation"
            id="contact-details-mapLocation"
            refusalText={refusalText}
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
        >
          {(props) => <Textarea dir="auto" {...props} {...register('openingHours')} />}
        </DetailField>
      </FieldGroup>

      <Button
        type="submit"
        className="w-full sm:w-auto sm:self-start"
        disabled={formState.isSubmitting}
      >
        {/* Both words hold the button's width, the one not said hidden, so
            that it keeps its width while it says it is saving and nothing
            moves (the owner on motion, 22 October 2026). */}
        <span className="grid">
          {[
            { words: t('ContactDetailsForm.save'), said: !formState.isSubmitting },
            { words: t('ContactDetailsForm.saving'), said: formState.isSubmitting },
          ].map(({ words, said }) => (
            <span
              key={words}
              aria-hidden={!said || undefined}
              className={cn('col-start-1 row-start-1', !said && 'invisible')}
            >
              {words}
            </span>
          ))}
        </span>
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
// what the form says about it, and its refusal, said in the language the
// portal is shown in, all of which the control names as its description.
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
  const refusal = errors[name]?.message;
  // A refusal of a detail that is too long says the limit, as the owner
  // chose on 18 October 2026.
  const limit = name in longest ? longest[name as keyof typeof longest] : undefined;
  const error =
    refusal === undefined ? undefined : (
      <Trans
        i18nKey={`ContactDetailsForm.refused.${refusal as RefusalMessage}`}
        components={{ longest: <>{limit === undefined ? null : formatNumber(limit)}</> }}
      />
    );
  const describedBy = [
    optional && `${id}-optional`,
    `${id}-description`,
    error !== undefined && `${id}-error`,
  ].filter((each) => typeof each === 'string');

  return (
    <Field className={className}>
      {/* As high as a label with its mark, so that two details side by side
          start their controls on one line, marked or not. */}
      <div className="flex min-h-5 flex-wrap items-center gap-2">
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
