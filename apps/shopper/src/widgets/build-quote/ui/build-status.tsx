import { getLocale } from 'next-intl/server';

import { pickerAddress } from '@/entities/category';

import type { Status } from '../model/status';

// The status of a Build's sheet (DESIGN.md's The status), under its title:
// its sentence in Body large in the Ink, each Category the Build still needs
// a link to its picker, or words alone on a Shared Build's page, which
// changes nothing (`linked`); and under it, in Body Soft Ink, a line for
// each CPU value the Complete Build rule read. It is read to a screen reader
// when a change in place alters it, its space moving with what it says.
export async function BuildStatus({
  status,
  linked = true,
}: {
  status: Status;
  linked?: boolean;
}) {
  const language = await getLocale();

  return (
    <div data-space="status" className="grid grid-cols-[minmax(0,1fr)]">
      <output
        data-testid="build-status"
        className="mx-auto mt-4 block max-w-[34ch] text-center text-lg text-balance"
      >
        {status.sentence.map((piece) =>
          typeof piece === 'string' ? (
            piece
          ) : !linked ? (
            <span
              key={piece.category}
              data-testid="still-needed"
              data-category={piece.category}
            >
              {piece.words}
            </span>
          ) : (
            <a
              key={piece.category}
              href={pickerAddress(language, piece.category)}
              data-testid="still-needed"
              data-category={piece.category}
              className="hover-underline"
            >
              {piece.words}
            </a>
          ),
        )}
      </output>
      {status.lines.map((line) => (
        <p
          key={line}
          data-testid="cpu-line"
          data-line={line}
          className="mx-auto mt-2.5 max-w-[34rem] text-center text-base text-muted-foreground"
        >
          {line}
        </p>
      ))}
    </div>
  );
}
