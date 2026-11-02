import type { PlatformRateResponse } from '@pcp/api-client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { setRefusalsBesideTheirFields, WhyNotAnswered } from '@/shared/api';
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
  OpeningSpace,
} from '@/shared/ui';

import {
  rateIn,
  rateMessage,
  type RateFormValues,
  refusalOfTheRate,
} from '../model/rate-typed';

const id = 'platform-rate-iqdPerUsd';

// The form for a new Platform Rate, as DESIGN.md's Fields give it: one
// field, "New rate", in whole dinars for one dollar, and Save. The rate is
// typed as the Admin's keyboard writes it, and what is not a number is
// refused beside the field before it is sent; anything else is sent, and
// the API's refusal is said beside the field, in words that name no limit.
// A refusal that names no field, or an API that cannot be reached, is said
// just above Save. Once the rate is saved, the field is emptied for the
// next one, since the plate above it shows the rate.
export function RateForm({
  save,
}: {
  // Sends the rate. It throws a `Refusal` when the API refuses it, and an
  // `Unreachable` when the API cannot be reached.
  save: (iqdPerUsd: number) => Promise<PlatformRateResponse>;
}) {
  const { register, handleSubmit, setError, reset, formState } = useForm<RateFormValues>({
    defaultValues: { iqdPerUsd: '' },
  });
  const refusal = formState.errors.iqdPerUsd?.message;
  // Why the rate was not saved, when the form says it above Save.
  const [notSaved, setNotSaved] = useState<{ why: Error } | undefined>(undefined);

  async function submit(typed: RateFormValues): Promise<void> {
    setNotSaved(undefined);
    try {
      await save(rateIn(typed.iqdPerUsd) ?? Number.NaN);
      reset({ iqdPerUsd: '' });
    } catch (error) {
      if (!setRefusalsBesideTheirFields(error, setError, refusalOfTheRate)) {
        setNotSaved({ why: error instanceof Error ? error : new Error(String(error)) });
      }
    }
  }

  return (
    <form
      noValidate
      data-testid="platform-rate-form"
      className="flex w-full max-w-[40rem] flex-col gap-6"
      onSubmit={handleSubmit(submit)}
    >
      <Field>
        <FieldLabel htmlFor={id}>New rate</FieldLabel>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={refusal !== undefined}
          aria-describedby={[`${id}-description`, refusal !== undefined && `${id}-error`]
            .filter((each) => typeof each === 'string')
            .join(' ')}
          {...register('iqdPerUsd', {
            validate: (typed) => {
              const rate = rateIn(typed);
              if (rate === null) return rateMessage('missing');
              return rate !== undefined || rateMessage('notANumber');
            },
          })}
        />
        <FieldDescription id={`${id}-description`}>
          Whole dinars for one dollar, such as 1,575.
        </FieldDescription>
        <FieldError id={`${id}-error`} data-testid="rate-refusal">
          {refusal}
        </FieldError>
      </Field>

      <OpeningSpace>
        {notSaved !== undefined && (
          <Alert variant="destructive" data-testid="refusal">
            <AlertTitle>The rate was not saved</AlertTitle>
            <AlertDescription>
              <WhyNotAnswered error={notSaved.why} />
            </AlertDescription>
          </Alert>
        )}
      </OpeningSpace>
      <Button
        type="submit"
        className="w-full sm:w-auto sm:self-start"
        disabled={formState.isSubmitting}
      >
        <BusyLabel busy={formState.isSubmitting} label="Save" busyLabel="Saving…" />
      </Button>
    </form>
  );
}
