import type { SendPartRequestRequest } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { SearchIcon } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Controller, type FieldErrors, FormProvider, useForm } from 'react-hook-form';

import { type CategoryKey, categoryName, useCategories } from '@/entities/category';
import { OfferDetailsFields } from '@/entities/offer';
import { setRefusalsBesideTheirFields, WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import { describedBy } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  BusyLabel,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  NameField,
  NativeSelect,
  NativeSelectOption,
  OpeningSpace,
} from '@/shared/ui';

import { partRequestOf, type PartRequestFormValues } from '../model/form-values';
import { type PartRefusal, refusalOf } from '../model/refusals';

// The search a form was opened from: the words searched, which start the
// form as the Part's name, and the Category the search was narrowed to, if
// it was.
export interface SearchedFor {
  words: string;
  category?: CategoryKey;
}

// The Part Request form, in the Vendor portal's language, as the dashboard's
// DESIGN.md lays it out (the owner's d4, taken under the standing instruction
// of 18 November 2026, part-requests ticket 02): one column at most 40rem
// wide. Opened from an empty catalog search, its head says so on a Raised
// Stone line with a magnifier. Then the Part's three fields, in the API's
// order of checks, with no legend of their own: its Category, the browser's
// own select, starting at the search's Category or at none; its name, which
// grows as a Part's name does and keeps its own direction; and its
// manufacturer part number, left to right. Then the Offer form's own price,
// stock and warranty fields (`OfferDetailsFields`), so that a request holds
// no price an Offer could not. No manufacturer and no specification is asked
// (CAT-4): those are the Admin's to give.
//
// Digits are typed as the Vendor's keyboard writes them, in the part number
// too, and read as Western ones before they are sent. A refusal from the API
// is said beside the field it names, in the portal's language, and that
// field takes the focus; one that names no field, or an API that cannot be
// reached, is the refusal panel just above the button, in an `OpeningSpace`
// whose space opens smoothly (the No Snap Rule). The pane's one primary
// button is last, as wide as the form on a phone, keeping its width while it
// waits (`BusyLabel`).
export function PartRequestForm({
  values,
  searchedFor,
  save,
}: {
  // What the form starts with.
  values: PartRequestFormValues;
  // The search it was opened from, if it was.
  searchedFor?: SearchedFor;
  // Sends the request. It throws a `Refusal` when the API refuses it, and an
  // `Unreachable` when the API cannot be reached.
  save: (sent: SendPartRequestRequest) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const categories = useCategories();
  const form = useForm<PartRequestFormValues>({ defaultValues: values });
  const { register, control, handleSubmit, setError, formState } = form;
  const { errors } = formState;
  // Why the request was not sent, when the form says it above its button.
  const [notSent, setNotSent] = useState<{ why: unknown } | undefined>(undefined);

  async function submit(typed: PartRequestFormValues): Promise<void> {
    setNotSent(undefined);
    try {
      await save(partRequestOf(typed));
    } catch (error) {
      if (!setRefusalsBesideTheirFields(error, setError, refusalOf)) {
        setNotSent({ why: error });
      }
    }
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        data-testid="part-request-form"
        className="flex w-full max-w-[40rem] min-w-0 flex-col gap-6"
        onSubmit={handleSubmit(submit)}
      >
        {searchedFor !== undefined && <FromTheSearch searchedFor={searchedFor} />}

        <PartField name="category" label={t('PartRequestForm.category')} errors={errors}>
          {(props) => (
            // Held by the form and given to the select, so that the
            // Category the form starts with is chosen once the Categories
            // arrive, as after a reload of a form opened from a search.
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <NativeSelect
                  className="w-full"
                  {...props}
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <NativeSelectOption value="">
                    {t('PartRequestForm.chooseCategory')}
                  </NativeSelectOption>
                  {categories.data?.map(({ key }) => (
                    <NativeSelectOption key={key} value={key}>
                      {categoryName(key)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
            />
          )}
        </PartField>

        <PartField
          name="name"
          label={t('PartRequestForm.name')}
          description={t('PartRequestForm.nameDescription')}
          errors={errors}
        >
          {(props) => <NameField {...props} {...register('name')} />}
        </PartField>

        <PartField
          name="partNumber"
          label={t('PartRequestForm.partNumber')}
          description={
            <Trans
              i18nKey="PartRequestForm.partNumberDescription"
              components={{ example: <AlwaysEnglish>100-100001084WOF</AlwaysEnglish> }}
            />
          }
          errors={errors}
        >
          {(props) => (
            <Input
              type="text"
              dir="ltr"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              {...props}
              {...register('partNumber')}
            />
          )}
        </PartField>

        <OfferDetailsFields idPrefix="part-request-form" />

        <OpeningSpace>
          {notSent !== undefined && (
            <Alert variant="destructive" data-testid="refusal">
              <AlertTitle>{t('PartRequestForm.notSent')}</AlertTitle>
              <AlertDescription>
                <WhyNotAnsweredInThePortal error={notSent.why} />
              </AlertDescription>
            </Alert>
          )}
        </OpeningSpace>
        <Button
          type="submit"
          className="w-full sm:w-auto sm:self-start"
          disabled={formState.isSubmitting}
        >
          <BusyLabel
            busy={formState.isSubmitting}
            label={t('PartRequestForm.send')}
            busyLabel={t('PartRequestForm.sending')}
          />
        </Button>
      </form>
    </FormProvider>
  );
}

// The line at the form's head when it was opened from an empty search: the
// words searched, `AlwaysEnglish`, and the Category the search was narrowed
// to, if any, which the form starts with, on Raised Stone with 8-pixel
// corners after a magnifier.
function FromTheSearch({ searchedFor }: { searchedFor: SearchedFor }) {
  const { category } = searchedFor;

  return (
    <p
      data-testid="from-the-search"
      className="flex items-start gap-2 rounded-card bg-secondary px-3 py-2.5 text-sm"
    >
      <SearchIcon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <span className="min-w-0">
        <Trans
          i18nKey={
            category === undefined
              ? 'PartRequestForm.fromTheSearch'
              : 'PartRequestForm.fromTheSearchInTheCategory'
          }
          components={{
            words: (
              <AlwaysEnglish className="wrap-anywhere">{searchedFor.words}</AlwaysEnglish>
            ),
            category: <>{category === undefined ? '' : categoryName(category)}</>,
          }}
        />
      </span>
    </p>
  );
}

// A refusal's sentence, in the language the portal is shown in. A limit is
// not named: the API holds the limits and says only that one was passed.
function RefusalText({ message }: { message: string }) {
  const { t } = useTranslation();
  return <>{t(`PartRequestForm.refused.${message as PartRefusal}`)}</>;
}

// What a control of the form is given to name its field and its state.
interface ControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

// One detail of the Part: its label, its control, what the form says about
// it, and its refusal, all of which the control names as its description.
function PartField({
  name,
  label,
  description,
  errors,
  children,
}: {
  name: 'category' | 'name' | 'partNumber';
  label: string;
  description?: ReactNode;
  errors: FieldErrors<PartRequestFormValues>;
  children: (props: ControlProps) => ReactNode;
}) {
  const id = `part-request-form-${name}`;
  const refusal = errors[name]?.message;

  return (
    <Field data-testid={`${name}-field`}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children({
        id,
        'aria-invalid': refusal !== undefined,
        'aria-describedby': describedBy(
          description !== undefined && `${id}-description`,
          refusal !== undefined && `${id}-error`,
        ),
      })}
      {description !== undefined && (
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      )}
      <FieldError id={`${id}-error`}>
        {refusal === undefined ? undefined : <RefusalText message={refusal} />}
      </FieldError>
    </Field>
  );
}
