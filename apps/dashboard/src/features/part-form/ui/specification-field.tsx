import type { SpecificationResponse } from '@pcp/api-client';
import { useFormContext } from 'react-hook-form';

import { labelOf } from '@/entities/category';

import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  NativeSelect,
  NativeSelectOption,
} from '@/shared/ui';

import type { PartFormValues } from '../model/form-values';
import { describedBy, errorOf, idOf } from './field-names';
import { NeededMark } from './needed-mark';
import { RowsField } from './rows-field';
import { TextListField } from './text-list-field';

// The field for one specification, with the control its kind calls for. A
// fixed set is a choice, and nothing outside it can be entered. Every field
// can be left empty, which keeps the specification missing.
export function SpecificationField({
  specification,
  name = `specifications.${specification.path}`,
}: {
  specification: SpecificationResponse;
  name?: string;
}) {
  const id = idOf(name);
  const neededId = specification.needed ? `${id}-needed` : undefined;

  switch (specification.kind) {
    case 'severalOf':
      return (
        <SeveralOfField specification={specification} name={name} neededId={neededId} />
      );
    case 'listOfText':
      return (
        <TextListField
          name={name}
          legend={<Legend specification={specification} neededId={neededId} />}
          entry={specification.label}
          adding={() => 'Add'}
          addingName={`Add to ${specification.label}`}
          descriptionId={neededId}
        />
      );
    case 'listOfRows':
      return (
        <RowsField
          specification={specification}
          name={name}
          legend={<Legend specification={specification} neededId={neededId} />}
          descriptionId={neededId}
        />
      );
    default:
      return (
        <SingleValueField specification={specification} name={name} neededId={neededId} />
      );
  }
}

function Legend({
  specification,
  neededId,
}: {
  specification: SpecificationResponse;
  neededId?: string;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      {labelOf(specification)}
      {neededId !== undefined && <NeededMark id={neededId} />}
    </span>
  );
}

// A number, a text, yes or no, or one of a set: one control.
function SingleValueField({
  specification,
  name,
  neededId,
}: {
  specification: SpecificationResponse;
  name: string;
  neededId?: string;
}) {
  const { register, formState } = useFormContext<PartFormValues>();
  const id = idOf(name);
  const error = errorOf(formState.errors, name);
  const errorId = `${id}-error`;
  const control = {
    id,
    'aria-invalid': error !== undefined,
    'aria-describedby': describedBy(neededId, error && errorId),
    ...register(name as 'name'),
  };

  return (
    <Field>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={id}>{labelOf(specification)}</FieldLabel>
        {neededId !== undefined && <NeededMark id={neededId} />}
      </div>
      {specification.kind === 'yesNo' ? (
        <NativeSelect className="w-full" {...control}>
          <NativeSelectOption value="">Not known</NativeSelectOption>
          <NativeSelectOption value="yes">Yes</NativeSelectOption>
          <NativeSelectOption value="no">No</NativeSelectOption>
        </NativeSelect>
      ) : specification.kind === 'oneOf' ? (
        <NativeSelect className="w-full" {...control}>
          <NativeSelectOption value="">Not known</NativeSelectOption>
          {specification.values?.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {value}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : (
        <Input
          type="text"
          autoComplete="off"
          inputMode={
            specification.kind === 'wholeNumber'
              ? 'numeric'
              : specification.kind === 'decimalNumber'
                ? 'decimal'
                : undefined
          }
          {...control}
        />
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}

// Several of a set: a box to tick for each value, in two columns, each row
// as high as a control so that a thumb can reach it.
function SeveralOfField({
  specification,
  name,
  neededId,
}: {
  specification: SpecificationResponse;
  name: string;
  neededId?: string;
}) {
  const { register, formState } = useFormContext<PartFormValues>();
  const id = idOf(name);
  const error = errorOf(formState.errors, name);
  const errorId = `${id}-error`;

  return (
    <FieldSet
      className="gap-1 sm:col-span-2"
      aria-describedby={describedBy(neededId, error && errorId)}
    >
      <FieldLegend variant="label" className="mb-1">
        <Legend specification={specification} neededId={neededId} />
      </FieldLegend>
      <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
        {specification.values?.map((value) => (
          <label key={value} className="flex min-h-control items-center gap-3 text-base">
            <input
              type="checkbox"
              value={value}
              className="size-5 shrink-0"
              aria-invalid={error !== undefined}
              {...register(name as 'name')}
            />
            {value}
          </label>
        ))}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </FieldSet>
  );
}
