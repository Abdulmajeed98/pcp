import type { PartResponse, SpecificationResponse } from '@pcp/api-client';

import { setAt, type SpecificationDocument, valueAt } from '@/entities/part';

// One entry of a list of text, such as a part number. React Hook Form's lists
// hold objects, never bare strings.
export interface TextEntry {
  value: string;
}

// One row of a list of rows, each field as typed, by the field's path.
export type RowEntry = Record<string, string>;

// What the form holds while the Admin fills it in. Each specification is at
// its path under `specifications`, as typed: text for a number, a text or
// one of a set; "yes", "no" or "" for yes or no; the values ticked for
// several of a set; entries for a list of text; rows for a list of rows. An
// empty one is missing. Whether each list of rows is known is under
// `rowsKnown`, at the same path, because "none" and "not known" differ.
export interface PartFormValues {
  name: string;
  manufacturer: string;
  partNumbers: TextEntry[];
  specifications: SpecificationDocument;
  rowsKnown: SpecificationDocument;
}

// What the API is sent: a Part's fields, with its specifications in OpenDB's
// field names and nesting, and every missing one left out.
export interface PartFields {
  name: string;
  manufacturer: string;
  partNumbers: string[];
  specifications: SpecificationDocument;
}

// The form's values for a new Part of a Category, or for a Part as it is.
export function formValuesOf(
  specifications: readonly SpecificationResponse[],
  part?: PartResponse,
): PartFormValues {
  const values: PartFormValues = {
    name: part?.name ?? '',
    manufacturer: part?.manufacturer ?? '',
    partNumbers: (part?.partNumbers ?? []).map((value) => ({ value })),
    specifications: {},
    rowsKnown: {},
  };

  for (const specification of specifications) {
    const value =
      part === undefined ? undefined : valueAt(part.specifications, specification.path);
    setAt(values.specifications, specification.path, typedOf(specification, value));
    if (specification.kind === 'listOfRows') {
      setAt(values.rowsKnown, specification.path, Array.isArray(value));
    }
  }

  return values;
}

// The Part's fields as the API is sent them, from what the form holds. A
// number is sent as a number when it is written as one, and as the text that
// was typed otherwise, so that the API, which keeps the specification list,
// refuses it beside its field.
export function partFieldsOf(
  specifications: readonly SpecificationResponse[],
  values: PartFormValues,
): PartFields {
  const document: SpecificationDocument = {};
  for (const specification of specifications) {
    const sent = sentOf(
      specification,
      valueAt(values.specifications, specification.path),
      valueAt(values.rowsKnown, specification.path) === true,
    );
    if (sent !== undefined) setAt(document, specification.path, sent);
  }

  return {
    name: values.name,
    manufacturer: values.manufacturer,
    partNumbers: values.partNumbers.map(({ value }) => value),
    specifications: document,
  };
}

function typedOf(specification: SpecificationResponse, value: unknown): unknown {
  switch (specification.kind) {
    case 'wholeNumber':
    case 'decimalNumber':
      return typeof value === 'number' ? String(value) : '';
    case 'text':
    case 'oneOf':
      return typeof value === 'string' ? value : '';
    case 'yesNo':
      return value === true ? 'yes' : value === false ? 'no' : '';
    case 'severalOf':
      return Array.isArray(value) ? value : [];
    case 'listOfText':
      return Array.isArray(value) ? value.map((each) => ({ value: String(each) })) : [];
    case 'listOfRows':
      return Array.isArray(value)
        ? value.map((row) => rowTypedOf(specification.fields ?? [], row))
        : [];
  }
}

function rowTypedOf(fields: readonly SpecificationResponse[], row: unknown): RowEntry {
  const record =
    typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {};
  return Object.fromEntries(
    fields.map((field) => [field.path, typedOf(field, record[field.path]) as string]),
  );
}

function sentOf(
  specification: SpecificationResponse,
  typed: unknown,
  rowsKnown: boolean,
): unknown {
  switch (specification.kind) {
    case 'wholeNumber':
    case 'decimalNumber':
      return numberOf(typed);
    case 'text':
    case 'oneOf':
      return typeof typed === 'string' && typed.trim() !== '' ? typed : undefined;
    case 'yesNo':
      return typed === 'yes' ? true : typed === 'no' ? false : undefined;
    case 'severalOf': {
      // A group of one checkbox gives its value, or false, and not a list.
      const ticked = Array.isArray(typed)
        ? typed
        : typeof typed === 'string'
          ? [typed]
          : [];
      return ticked.length > 0 ? ticked : undefined;
    }
    case 'listOfText': {
      const texts = (Array.isArray(typed) ? (typed as TextEntry[]) : [])
        .map(({ value }) => value.trim())
        .filter((value) => value !== '');
      return texts.length > 0 ? texts : undefined;
    }
    case 'listOfRows':
      if (!rowsKnown) return undefined;
      return (Array.isArray(typed) ? (typed as RowEntry[]) : [])
        .map((row) => rowSentOf(specification.fields ?? [], row))
        .filter((row) => Object.keys(row).length > 0);
  }
}

// A row as it is sent: each field that is not missing. A row with every field
// missing is left out.
function rowSentOf(
  fields: readonly SpecificationResponse[],
  row: RowEntry,
): Record<string, unknown> {
  const sent: Record<string, unknown> = {};
  for (const field of fields) {
    const value = sentOf(field, row[field.path], false);
    if (value !== undefined) sent[field.path] = value;
  }
  return sent;
}

// A number as written, such as "6" or "3.8", is sent as a number. Anything
// else is sent as typed, for the API to refuse.
function numberOf(typed: unknown): unknown {
  if (typeof typed !== 'string') return undefined;
  const written = typed.trim();
  if (written === '') return undefined;
  return /^-?\d+(\.\d+)?$/.test(written) ? Number(written) : written;
}
