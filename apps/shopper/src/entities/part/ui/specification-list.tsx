import type { LabelledSpecificationResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';

import { specificationText } from '../model/specification-text';

// Every specification a Part holds, under its box label (DESIGN.md's The
// specifications): in the order the API answers them, its Category's order,
// in two columns from 48rem, each its English label at the start and its
// value at the end at 600, both in English and left to right (LANG-3), yes
// and no as words, and a list of rows a line for each row. What the API
// leaves out, the Part does not hold, and is not shown.
export function SpecificationList({
  specifications,
}: {
  specifications: readonly LabelledSpecificationResponse[];
}) {
  return (
    <dl
      data-testid="specifications"
      className="mt-8 grid gap-x-12 gap-y-2.5 md:grid-cols-2"
    >
      {specifications.map((specification) => (
        <div
          key={specification.path}
          data-testid="specification"
          data-specification={specification.path}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4"
        >
          <dt className="min-w-0 wrap-break-word">
            <AlwaysEnglish>{specification.label}</AlwaysEnglish>
          </dt>
          <dd className="max-w-[18rem] text-end font-semibold wrap-break-word">
            {specificationText(specification).map((text) => (
              <span key={text} className="block">
                <AlwaysEnglish>{text}</AlwaysEnglish>
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
