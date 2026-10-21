import { formatNumber } from '@pcp/i18n';
import { PlusIcon, XIcon } from 'lucide-react';
import { useRef } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button, FieldError, FieldLegend, FieldSet, Input } from '@/shared/ui';

import type { PartFormValues } from '../model/form-values';
import { Entry, useEntriesMotion } from './entries-motion';
import { describedBy, errorOf, idOf } from './field-names';

// A list of text, such as a Part's part numbers or a case's front panel
// ports: one line for each entry, each with a way to remove it, and a way to
// add one. `entry` names one entry, as in "Part number 1", and `adding` the
// button that adds one, which `addingName` names in full when its words alone
// would not say which list it adds to.
//
// An entry added takes the focus, so the Admin types at once, and arrives;
// an entry removed hands the focus to the one that takes its place, or the
// one before it, or the Add button, and leaves (redesign ticket 08).
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
  const { control, register, formState, setFocus } = useFormContext<PartFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as 'partNumbers',
  });
  const { leave, staying, entryProps } = useEntriesMotion(fields, remove);
  const addButton = useRef<HTMLButtonElement>(null);
  const error = errorOf(formState.errors, name);
  const errorId = `${idOf(name)}-error`;
  const entryNameAt = (index: number) => `${name}.${index}.value`;

  function removeEntry(id: string): void {
    const at = staying.findIndex((field) => field.id === id);
    const next = staying[at + 1] ?? staying[at - 1];
    if (next === undefined) addButton.current?.focus();
    else setFocus(entryNameAt(fields.indexOf(next)) as 'partNumbers.0.value');
    leave(id);
  }

  return (
    <FieldSet
      className="col-span-full gap-2"
      aria-describedby={describedBy(descriptionId, error && errorId)}
    >
      <FieldLegend variant="label" className="mb-1">
        {legend}
      </FieldLegend>
      {fields.map((field, index) => {
        // An entry on its way out keeps its place in the form's values until
        // it has left, so the entries that stay are counted without it.
        const shown = staying.indexOf(field);
        const label = `${entry} ${formatNumber((shown === -1 ? index : shown) + 1)}`;
        const entryName = entryNameAt(index);
        const entryError = errorOf(formState.errors, entryName);
        return (
          <Entry key={field.id} {...entryProps(field.id)}>
            <div className="flex flex-col gap-1">
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
                  onClick={() => removeEntry(field.id)}
                >
                  <XIcon />
                </Button>
              </div>
              <FieldError id={`${idOf(entryName)}-error`}>{entryError}</FieldError>
            </div>
          </Entry>
        );
      })}
      <Button
        ref={addButton}
        type="button"
        variant="outline"
        className="self-start"
        aria-label={addingName}
        onClick={() => append({ value: '' })}
      >
        <PlusIcon data-icon="inline-start" />
        {adding(staying.length)}
      </Button>
      <FieldError id={errorId}>{error}</FieldError>
    </FieldSet>
  );
}
