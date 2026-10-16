import type { SpecificationResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { CircleAlertIcon } from 'lucide-react';

import { labelOf } from '@/entities/category';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';

// A specification's value as a Part's page shows it, by its kind: a number
// with its unit, yes or no in words, the values of a list, and a list of
// rows as a small table. A specification, a number and its unit are English
// in every language, and are kept apart from the text around them.
export function SpecificationValue({
  specification,
  value,
}: {
  specification: SpecificationResponse;
  value: unknown;
}) {
  if (value === undefined || value === null) return <NotKnown />;

  switch (specification.kind) {
    case 'wholeNumber':
    case 'decimalNumber':
      return (
        <AlwaysEnglish>
          {typeof value === 'number' ? formatNumber(value) : String(value)}
          {specification.unit !== undefined && ` ${specification.unit}`}
        </AlwaysEnglish>
      );
    case 'yesNo':
      return <>{value === true ? 'Yes' : 'No'}</>;
    case 'severalOf':
    case 'listOfText':
      return <AlwaysEnglish>{(value as unknown[]).map(String).join(', ')}</AlwaysEnglish>;
    case 'listOfRows':
      return (
        <Rows specification={specification} rows={value as Record<string, unknown>[]} />
      );
    default:
      return <AlwaysEnglish>{String(value)}</AlwaysEnglish>;
  }
}

// A specification the Part holds no value for.
export function NotKnown() {
  return <span className="text-muted-foreground">Not known</span>;
}

// A needed specification the Part holds no value for: something the Admin
// has to fill in for its Compatibility Rule to check, so it is in Action Red,
// with a mark and in words.
export function NeededNotKnown() {
  return (
    <span
      data-testid="missing-needed"
      className="inline-flex items-center gap-1.5 font-medium text-destructive"
    >
      <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
      Needed, not known
    </span>
  );
}

// A list of rows, one row of the table for each, under its fields' labels.
// An empty list says that the Part has none.
function Rows({
  specification,
  rows,
}: {
  specification: SpecificationResponse;
  rows: Record<string, unknown>[];
}) {
  if (rows.length === 0) return <>None</>;
  const fields = specification.fields ?? [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {fields.map((field) => (
            <TableHead key={field.path}>{labelOf(field)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          // The rows have no identity of their own, and are never reordered.
          <TableRow key={index}>
            {fields.map((field) => (
              <TableCell key={field.path}>
                <SpecificationValue specification={field} value={row[field.path]} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
