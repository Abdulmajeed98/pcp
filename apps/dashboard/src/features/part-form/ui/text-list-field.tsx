import { formatNumber } from '@pcp/i18n';
import { PlusIcon, XIcon } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button, FieldError, FieldLegend, FieldSet, Input } from '@/shared/ui';

import type { PartFormValues } from '../model/form-values';
import { describedBy, errorOf, idOf } from './field-names';

// A list of text, such as a Part's part numbers or a case's front panel
// ports: one line for each entry, each with a way to remove it, and a way to
// add one. `entry` names one entry, as in "Part number 1", and `adding` the
// button that adds one, which `addingName` names in full when its words alone
// would not say which list it adds to.
export function TextListField({
  name,
  legend,
  entry,
  adding,
  addingName,
  descriptionId,
}: {
  name: string;
  legend: React.ReactNode;
  entry: string;
  adding: (count: number) => string;
  addingName?: string;
  descriptionId?: string;
}) {
  const { control, register, formState } = useFormContext<PartFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as 'partNumbers',
  });
  const error = errorOf(formState.errors, name);
  const errorId = `${idOf(name)}-error`;

  return (
    <FieldSet
      className="gap-2 sm:col-span-2"
      aria-describedby={describedBy(descriptionId, error && errorId)}
    >
      <FieldLegend variant="label" className="mb-1">
        {legend}
      </FieldLegend>
      {fields.map((field, index) => {
        const label = `${entry} ${formatNumber(index + 1)}`;
        const entryName = `${name}.${index}.value`;
        const entryError = errorOf(formState.errors, entryName);
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <div className="flex gap-2">
              <Input
                aria-label={label}
                aria-invalid={entryError !== undefined}
                aria-describedby={describedBy(entryError && `${idOf(entryName)}-error`)}
                autoComplete="off"
                {...register(entryName as 'partNumbers.0.value')}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Remove ${label}`}
                onClick={() => remove(index)}
              >
                <XIcon />
              </Button>
            </div>
            <FieldError id={`${idOf(entryName)}-error`}>{entryError}</FieldError>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        className="self-start"
        aria-label={addingName}
        onClick={() => append({ value: '' })}
      >
        <PlusIcon data-icon="inline-start" />
        {adding(fields.length)}
      </Button>
      <FieldError id={errorId}>{error}</FieldError>
    </FieldSet>
  );
}
