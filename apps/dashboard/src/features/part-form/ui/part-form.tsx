import type { CategoryResponse, PartResponse, SubErrorResponse } from '@pcp/api-client';
import { type FieldPath, FormProvider, useForm } from 'react-hook-form';

import { setRefusalsBesideTheirFields } from '@/shared/api';
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
} from '@/shared/ui';

import {
  type PartFields,
  type PartFormValues,
  formValuesOf,
  partFieldsOf,
} from '../model/form-values';
import { fieldOf, messageOf, partFieldMessages, whyNotSaved } from '../model/refusals';
import { describedBy, errorOf } from './field-names';
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
// the form is shown above it.
export function PartForm({
  category,
  part,
  submitLabel,
  save,
}: {
  category: CategoryResponse;
  part?: PartResponse;
  submitLabel: string;
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
        ? { field: fieldOf(each) as FieldPath<PartFormValues>, message: messageOf(each) }
        : undefined,
    );
    if (!besideAField) setError('root.refusal', { message: whyNotSaved(error) });
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
      <form noValidate className="flex flex-col gap-8" onSubmit={handleSubmit(submit)}>
        {refusal !== undefined && (
          <Alert variant="destructive" data-testid="refusal">
            <AlertTitle>The Part was not saved.</AlertTitle>
            <AlertDescription>{refusal}</AlertDescription>
          </Alert>
        )}

        <FieldSet>
          <FieldLegend>The Part</FieldLegend>
          <FieldGroup className="grid sm:grid-cols-2 sm:gap-x-6">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="part-name">Name</FieldLabel>
              <Input
                id="part-name"
                autoComplete="off"
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
          <FieldGroup className="grid items-start sm:grid-cols-2 sm:gap-x-6">
            {category.specifications.map((specification) => (
              <SpecificationField key={specification.path} specification={specification} />
            ))}
          </FieldGroup>
        </FieldSet>

        <Button type="submit" className="self-start" disabled={formState.isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </FormProvider>
  );
}
