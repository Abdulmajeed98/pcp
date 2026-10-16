import type { SpecificationResponse } from '@pcp/api-client';
import { PlusIcon, XIcon } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { Button, FieldDescription, FieldError, FieldLegend, FieldSet } from '@/shared/ui';

import type { PartFormValues, RowEntry } from '../model/form-values';
import { describedBy, errorOf, idOf } from './field-names';
import { SpecificationField } from './specification-field';

// A list of rows, such as a motherboard's M.2 slots, each row with fields of
// its own. It is not known until a row is added. Once known, it may be
// empty, which says that the Part has none, and it can be made not known
// again.
export function RowsField({
  specification,
  name,
  legend,
  descriptionId,
}: {
  specification: SpecificationResponse;
  name: string;
  legend: React.ReactNode;
  descriptionId?: string;
}) {
  const { control, setValue, formState } = useFormContext<PartFormValues>();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: name as 'partNumbers',
  });
  const knownName = name.replace(/^specifications\./, 'rowsKnown.') as 'name';
  const known = useWatch({ control, name: knownName }) as unknown as boolean;
  const error = errorOf(formState.errors, name);
  const errorId = `${idOf(name)}-error`;
  const rowFields = specification.fields ?? [];

  function addARow(): void {
    setValue(knownName, true as never);
    append(emptyRow(rowFields) as never);
  }

  function makeNotKnown(): void {
    setValue(knownName, false as never);
    replace([]);
  }

  return (
    <FieldSet
      className="gap-2 sm:col-span-2"
      aria-describedby={describedBy(descriptionId, error && errorId)}
    >
      <FieldLegend variant="label" className="mb-1">
        {legend}
      </FieldLegend>
      {!known && <FieldDescription>Not known.</FieldDescription>}
      {known && fields.length === 0 && <FieldDescription>None.</FieldDescription>}
      {fields.map((field, index) => (
        <FieldSet key={field.id} className="gap-3 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <FieldLegend variant="label" className="mb-0">
              {specification.label} {index + 1}
            </FieldLegend>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Remove ${specification.label} ${index + 1}`}
              onClick={() => remove(index)}
            >
              <XIcon />
            </Button>
          </div>
          {rowFields.map((rowField) => (
            <SpecificationField
              key={rowField.path}
              specification={rowField}
              name={`${name}.${index}.${rowField.path}`}
            />
          ))}
        </FieldSet>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          aria-label={`Add a row to ${specification.label}`}
          onClick={addARow}
        >
          <PlusIcon data-icon="inline-start" />
          Add a row
        </Button>
        {known && (
          <Button
            type="button"
            variant="ghost"
            aria-label={`Make ${specification.label} not known`}
            onClick={makeNotKnown}
          >
            Not known
          </Button>
        )}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </FieldSet>
  );
}

function emptyRow(fields: readonly SpecificationResponse[]): RowEntry {
  return Object.fromEntries(fields.map((field) => [field.path, '']));
}
