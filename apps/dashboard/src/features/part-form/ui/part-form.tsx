import type { CategoryResponse, PartResponse, SubErrorResponse } from '@pcp/api-client';
import { cn } from 'cn';
import { type TransitionEvent, useRef } from 'react';
import { type FieldPath, FormProvider, useForm } from 'react-hook-form';

import { setRefusalsBesideTheirFields } from '@/shared/api';
import { aScroll, describedBy } from '@/shared/lib';
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
  OpeningSpace,
} from '@/shared/ui';

import {
  type PartFields,
  type PartFormValues,
  formValuesOf,
  partFieldsOf,
} from '../model/form-values';
import { fieldOf, messageOf, partFieldMessages, whyNotSaved } from '../model/refusals';
import { errorOf } from './field-names';
import { NameField } from './name-field';
import { SpecificationField } from './specification-field';
import { TextListField } from './text-list-field';

// A Part's form: its name, its manufacturer, its part numbers, and one field
// for each specification its Category's list names, in the list's order,
// with the needed ones marked. It is built from the list the API answers,
// and holds no copy of its own. It is empty for a new Part, or filled with a
// Part as it is.
//
// Saving sends the whole Part. A refusal from the API is shown beside the
// field it names, which takes the focus, and a refusal that names no field of
// the form is shown beside the button just pressed, in sight, rather than at
// the head of a long form scrolled out of it (redesign ticket 08's break-ui).
// While the Part is on its way, the button keeps its width, says so in
// `busyLabel`, and waits.
//
// As the dashboard's DESIGN.md lays out a form (redesign ticket 08): its
// fields go two to a row only where the form itself is 40rem wide, so beside
// the list on a desk, where the form has five twelfths of the sheet, they go
// one to a row; and its button is as wide as the form where the form is
// narrower than that.
export function PartForm({
  category,
  part,
  submitLabel,
  busyLabel,
  save,
}: {
  category: CategoryResponse;
  part?: PartResponse;
  submitLabel: string;
  busyLabel: string;
  // Sends the Part. It throws a `Refusal` when the API refuses it, and an
  // `Unreachable` when the API cannot be reached.
  save: (fields: PartFields) => Promise<unknown>;
}) {
  const form = useForm<PartFormValues>({
    defaultValues: formValuesOf(category.specifications, part),
  });
  const { register, handleSubmit, setError, formState } = form;
  const nameError = errorOf(formState.errors, 'name');
  const manufacturerError = errorOf(formState.errors, 'manufacturer');
  const refusal = formState.errors.root?.refusal?.message;
  const busy = formState.isSubmitting;
  const end = useRef<HTMLDivElement>(null);

  // A refusal that arrives beside the button is kept in sight with it, once
  // its space has opened, by a scroll as smooth as the opening (the No Snap
  // Rule), or at once with reduced motion, which drops a movement of the
  // whole screen (DESIGN.md's Reduced motion).
  function keepInSight(event: TransitionEvent<HTMLDivElement>): void {
    if (refusal === undefined || event.propertyName !== 'grid-template-rows') return;
    end.current?.scrollIntoView({ block: 'nearest', behavior: aScroll() });
  }

  async function submit(values: PartFormValues): Promise<void> {
    try {
      await save(partFieldsOf(category.specifications, values));
    } catch (error) {
      showWhyNot(error);
    }
  }

  function showWhyNot(error: unknown): void {
    const besideAField = setRefusalsBesideTheirFields(error, setError, (each) =>
      isOnTheForm(each)
        ? {
            field: fieldOf(each) as FieldPath<PartFormValues>,
            message: messageOf(each, kindOf(fieldOf(each))),
          }
        : undefined,
    );
    if (!besideAField) setError('root.refusal', { message: whyNotSaved(error) });
  }

  // The kind of the specification a refused field holds, as
  // `specifications.cores.total` or, in a list of rows,
  // `specifications.pcie_slots.1.quantity`.
  function kindOf(field: string | undefined): string | undefined {
    const path = field?.replace(/^specifications\./, '');
    if (path === undefined) return undefined;
    const named = category.specifications.find((each) => each.path === path);
    if (named !== undefined) return named.kind;
    const list = category.specifications.find(
      (each) => each.kind === 'listOfRows' && path.startsWith(`${each.path}.`),
    );
    // After the list's path come the row's place and the field's own path.
    const inTheRow = path
      .slice((list?.path.length ?? 0) + 1)
      .split('.')
      .slice(1)
      .join('.');
    return list?.fields?.find((each) => each.path === inTheRow)?.kind;
  }

  // Whether a refusal names a field this form shows.
  function isOnTheForm(error: SubErrorResponse): boolean {
    const field = fieldOf(error);
    if (field === undefined) return false;
    if (field === 'name' || field === 'manufacturer' || field.startsWith('partNumbers')) {
      return true;
    }
    return category.specifications.some(
      ({ path }) =>
        field === `specifications.${path}` || field.startsWith(`specifications.${path}.`),
    );
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        className="@container/part-form flex flex-col gap-8"
        onSubmit={handleSubmit(submit)}
      >
        <FieldSet>
          <FieldLegend>The Part</FieldLegend>
          <FieldGroup className="grid @min-[40rem]/part-form:grid-cols-2 @min-[40rem]/part-form:gap-x-6">
            <Field className="col-span-full">
              <FieldLabel htmlFor="part-name">Name</FieldLabel>
              <NameField
                id="part-name"
                aria-invalid={nameError !== undefined}
                aria-describedby={describedBy(nameError && 'part-name-error')}
                {...register('name', {
                  validate: (name) => name.trim() !== '' || partFieldMessages.name,
                })}
              />
              <FieldError id="part-name-error">{nameError}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="part-manufacturer">Manufacturer</FieldLabel>
              <Input
                id="part-manufacturer"
                autoComplete="off"
                aria-invalid={manufacturerError !== undefined}
                aria-describedby={describedBy(
                  manufacturerError && 'part-manufacturer-error',
                )}
                {...register('manufacturer', {
                  validate: (manufacturer) =>
                    manufacturer.trim() !== '' || partFieldMessages.manufacturer,
                })}
              />
              <FieldError id="part-manufacturer-error">{manufacturerError}</FieldError>
            </Field>
            <TextListField
              name="partNumbers"
              legend="Part numbers"
              entry="Part number"
              adding={(count) =>
                count === 0 ? 'Add a part number' : 'Add another part number'
              }
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Specifications</FieldLegend>
          <FieldDescription className="-mt-2">
            Leave a specification empty when it is not known. The needed ones are read by a
            Compatibility Rule, so fill those in first.
          </FieldDescription>
          <FieldGroup className="grid items-start @min-[40rem]/part-form:grid-cols-2 @min-[40rem]/part-form:gap-x-6">
            {category.specifications.map((specification) => (
              <SpecificationField key={specification.path} specification={specification} />
            ))}
          </FieldGroup>
        </FieldSet>

        <div
          ref={end}
          className="flex scroll-my-4 flex-col gap-4"
          onTransitionEnd={keepInSight}
        >
          {/* Its space opens and closes smoothly (the No Snap Rule). */}
          <OpeningSpace>
            {refusal !== undefined && (
              <Alert variant="destructive" data-testid="refusal">
                <AlertTitle>The Part was not saved.</AlertTitle>
                <AlertDescription>{refusal}</AlertDescription>
              </Alert>
            )}
          </OpeningSpace>
          <Button
            type="submit"
            className={cn(
              'self-start @max-[40rem]/part-form:self-stretch',
              busy && 'disabled:opacity-100',
            )}
            disabled={busy}
          >
            {/* Both words in one cell, so that the button keeps the width of
                the longer while it waits; only the shown one names it. */}
            <span className="grid">
              <span className={cn('col-start-1 row-start-1', busy && 'invisible')}>
                {submitLabel}
              </span>
              <span className={cn('col-start-1 row-start-1', !busy && 'invisible')}>
                {busyLabel}
              </span>
            </span>
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
