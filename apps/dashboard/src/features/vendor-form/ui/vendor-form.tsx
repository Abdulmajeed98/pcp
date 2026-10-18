import type { CreateVendorRequest } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import type { ReactNode } from 'react';
import { type FieldErrors, useForm, type UseFormRegisterReturn } from 'react-hook-form';

import { cities, cityName, longest, MapLocationField } from '@/entities/vendor';
import { Refusal } from '@/shared/api';
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
  NativeSelect,
  NativeSelectOption,
  OptionalMark,
  Textarea,
} from '@/shared/ui';

import {
  newVendorFormValues,
  type VendorFormValues,
  vendorRequestOf,
} from '../model/form-values';
import { detailOf, messageOf, missingDetailMessages, whyNotSaved } from '../model/refusals';

// A Vendor's form, in the Admin console's English: every detail of a Vendor,
// in three groups, what the Vendor is, its contact details and its Login,
// with the optional details marked so and each length limit said. The
// address and the opening hours are written on several lines, and what the
// Vendor writes is laid out in its own direction as it is typed.
//
// Saving sends every detail. A refusal from the API is shown beside the
// detail it names, which takes the focus, and a refusal that names no detail
// of the form is shown above it.
export function VendorForm({
  submitLabel,
  save,
}: {
  submitLabel: string;
  // Sends the Vendor. It throws a `Refusal` when the API refuses it, and an
  // `Unreachable` when the API cannot be reached.
  save: (request: CreateVendorRequest) => Promise<unknown>;
}) {
  const { register, control, handleSubmit, setError, formState } =
    useForm<VendorFormValues>({
      defaultValues: newVendorFormValues,
    });
  const { errors } = formState;
  const refusal = errors.root?.refusal?.message;
  const required = (detail: keyof typeof missingDetailMessages) => ({
    validate: (text: string) => text.trim() !== '' || missingDetailMessages[detail],
  });

  async function submit(values: VendorFormValues): Promise<void> {
    try {
      await save(vendorRequestOf(values));
    } catch (error) {
      showWhyNot(error);
    }
  }

  function showWhyNot(error: unknown): void {
    const onTheForm =
      error instanceof Refusal
        ? error.errors.flatMap((each) => {
            const detail = detailOf(each);
            return detail === undefined ? [] : [{ detail, message: messageOf(each) }];
          })
        : [];
    for (const [index, { detail, message }] of onTheForm.entries()) {
      setError(detail, { message }, { shouldFocus: index === 0 });
    }
    if (onTheForm.length === 0) setError('root.refusal', { message: whyNotSaved(error) });
  }

  return (
    <form noValidate className="flex flex-col gap-8" onSubmit={handleSubmit(submit)}>
      {refusal !== undefined && (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>The Vendor was not created.</AlertTitle>
          <AlertDescription>{refusal}</AlertDescription>
        </Alert>
      )}

      <FieldSet>
        <FieldLegend>The Vendor</FieldLegend>
        <FieldGroup className="grid sm:grid-cols-2 sm:gap-x-6">
          <DetailField
            name="name"
            label="Name"
            errors={errors}
            description={`As the Vendor writes it, in any language. At most ${formatNumber(longest.name)} characters.`}
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                dir="auto"
                autoComplete="off"
                {...props}
                {...register('name', required('name'))}
              />
            )}
          </DetailField>
          <DetailField name="city" label="City" errors={errors}>
            {(props) => (
              <NativeSelect className="w-full" {...props} {...register('city')}>
                {cities.map((city) => (
                  <NativeSelectOption key={city} value={city}>
                    {cityName(city)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </DetailField>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Contact details</FieldLegend>
        <FieldDescription className="-mt-2">
          The Vendor may change these itself, from its portal.
        </FieldDescription>
        <FieldGroup className="grid items-start sm:grid-cols-2 sm:gap-x-6">
          <DetailField
            name="address"
            label="Address"
            errors={errors}
            description={`As the Vendor writes it, on as many lines as it needs. At most ${formatNumber(longest.address)} characters.`}
            className="sm:col-span-2"
          >
            {(props) => (
              <Textarea
                dir="auto"
                {...props}
                {...register('address', required('address'))}
              />
            )}
          </DetailField>
          <div className="sm:col-span-2">
            <MapLocationField
              control={control}
              name="mapLocation"
              id="vendor-mapLocation"
            />
          </div>
          <DetailField
            name="phoneNumber"
            label="Phone number"
            errors={errors}
            description="A mobile number or a landline, written in any way, such as 066 223 4567."
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
            label="WhatsApp number"
            optional
            errors={errors}
            description="A mobile number."
          >
            {(props) => <PhoneInput {...props} registered={register('whatsAppNumber')} />}
          </DetailField>
          <DetailField
            name="instagramName"
            label="Instagram name"
            optional
            errors={errors}
            description={`The name, with or without an @, or its profile’s address. A name is at most ${formatNumber(longest.instagramName)} characters.`}
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
            label="Opening hours"
            optional
            errors={errors}
            description={`As the Vendor writes them, on as many lines as they need. At most ${formatNumber(longest.openingHours)} characters.`}
            className="sm:col-span-2"
          >
            {(props) => <Textarea dir="auto" {...props} {...register('openingHours')} />}
          </DetailField>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Its Login</FieldLegend>
        <FieldGroup className="grid sm:grid-cols-2 sm:gap-x-6">
          <DetailField
            name="loginPhoneNumber"
            label="Login phone number"
            errors={errors}
            description="A mobile number. The Vendor logs in with it, and its login details are handed over to it on WhatsApp."
          >
            {(props) => (
              <PhoneInput
                {...props}
                registered={register('loginPhoneNumber', required('loginPhoneNumber'))}
              />
            )}
          </DetailField>
        </FieldGroup>
      </FieldSet>

      <Button type="submit" className="self-start" disabled={formState.isSubmitting}>
        {submitLabel}
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

// One detail of the Vendor: its label, marked when it is optional, its
// control, what the form says about it, and its error, all of which the
// control names as its description.
function DetailField({
  name,
  label,
  optional = false,
  description,
  errors,
  className,
  children,
}: {
  name: keyof VendorFormValues;
  label: string;
  optional?: boolean;
  description?: string;
  errors: FieldErrors<VendorFormValues>;
  className?: string;
  children: (props: ControlProps) => ReactNode;
}) {
  const id = `vendor-${name}`;
  const error = errors[name]?.message;
  const describedBy = [
    optional && `${id}-optional`,
    description !== undefined && `${id}-description`,
    error !== undefined && `${id}-error`,
  ].filter((each) => typeof each === 'string');

  return (
    <Field className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {optional && <OptionalMark id={`${id}-optional`}>Optional</OptionalMark>}
      </div>
      {children({
        id,
        'aria-invalid': error !== undefined,
        'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
      })}
      {description !== undefined && (
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      )}
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
