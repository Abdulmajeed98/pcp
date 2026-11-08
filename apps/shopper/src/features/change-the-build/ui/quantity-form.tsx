'use client';

import { cn } from 'cn';
import { type FormEvent, useId, useState } from 'react';

import { mostOfOne, typedQuantityIn } from '@/entities/build';

import { useChangesInPlace } from './changes-in-place';

// The quantity of a RAM kit or a drive (DESIGN.md's The quantity): two cells
// of the Board, − and +, each 44 pixels square, with the figure between them
// on the Bone Ground, 56 pixels wide and 44 tall, in tabular figures at 600
// with the input's 3-pixel line in the Ink along its foot. Each cell is a
// button of a plain form, sent with POST to `/<language>/build/quantity`,
// that sends the quantity one less or one more; − is off at 1 and + at 16,
// Remove being the way to none. The form is named for a screen reader by the
// Part, and its cells "One fewer" and "One more".
//
// The figure is a field typed on the phone's number pad, which takes
// Western, Arabic-Indic or Eastern Arabic-Indic digits (DESIGN.md's The
// quantity on the number pad). Done sends it, without script too: the form's
// first button, out of sight, carries the typed figure, so that Enter never
// sends −. With script a figure outside 1 to 16 is not sent, and the form
// says why under it, as the price range does; without script the server
// refuses it and the page says the same (`refused`).
//
// With script the figure changes at once, as it is typed or tapped, and the
// change is sent in place (`inPlace`); without it the page is drawn anew.
export function QuantityForm({
  action,
  part,
  quantity,
  refused,
  words,
}: {
  action: string;
  part: string;
  quantity: number;
  refused?: string;
  words: {
    label: string;
    figure: string;
    oneFewer: string;
    oneMore: string;
    set: string;
    notAQuantity: string;
  };
}) {
  const inPlace = useChangesInPlace();
  const [shown, setShown] = useState(String(quantity));
  const [problem, setProblem] = useState(refused);
  // The quantity the page was last drawn with: once the server draws it
  // again, the figure shows what it holds.
  const [drawnWith, setDrawnWith] = useState(quantity);
  if (drawnWith !== quantity) {
    setDrawnWith(quantity);
    setShown(String(quantity));
    setProblem(undefined);
  }
  const now = typedQuantityIn(shown) ?? quantity;
  const said = useId();

  function send(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const byACell = submitter instanceof HTMLButtonElement && submitter.name === 'quantity';
    if (!byACell && typedQuantityIn(shown) === undefined) {
      event.preventDefault();
      setProblem(words.notAQuantity);
      return;
    }
    setProblem(undefined);
    if (byACell) setShown(submitter.value);
    if (inPlace === undefined) return;
    event.preventDefault();
    inPlace(event.currentTarget, submitter);
  }

  const cell =
    'pressable no-callout grid size-control shrink-0 cursor-pointer place-items-center bg-secondary text-xl font-semibold text-secondary-foreground hover:bg-secondary-pressed active:bg-secondary-pressed disabled:cursor-default disabled:text-muted-foreground disabled:hover:bg-secondary';

  return (
    <div className="grid min-w-0 gap-1">
      <form
        action={action}
        method="post"
        aria-label={words.label}
        data-quantity={part}
        data-testid="quantity"
        className="flex items-stretch"
        onSubmit={send}
      >
        <input type="hidden" name="part" value={part} />
        {/* The form's first button: Enter or Done in the figure sends it,
            and with it the typed figure alone. */}
        <button type="submit" tabIndex={-1} className="sr-only">
          {words.set}
        </button>
        <button
          type="submit"
          name="quantity"
          value={now - 1}
          aria-label={words.oneFewer}
          disabled={now <= 1}
          data-testid="one-fewer"
          className={cell}
        >
          <span aria-hidden="true">−</span>
        </button>
        <input
          name="typed"
          value={shown}
          onChange={(event) => setShown(event.target.value)}
          type="text"
          inputMode="numeric"
          enterKeyHint="done"
          autoComplete="off"
          aria-label={words.figure}
          aria-invalid={problem === undefined ? undefined : true}
          aria-describedby={problem === undefined ? undefined : said}
          data-testid="quantity-figure"
          className="figures h-control w-14 min-w-0 appearance-none rounded-none border-0 border-b-[3px] border-input bg-background text-center text-base font-semibold text-foreground"
        />
        <button
          type="submit"
          name="quantity"
          value={now + 1}
          aria-label={words.oneMore}
          disabled={now >= mostOfOne}
          data-testid="one-more"
          className={cell}
        >
          <span aria-hidden="true">+</span>
        </button>
      </form>
      <p
        id={said}
        data-testid="quantity-problem"
        aria-live="polite"
        className={cn(
          'max-w-[20rem] text-sm text-foreground',
          problem === undefined && 'sr-only',
        )}
      >
        {problem}
      </p>
    </div>
  );
}
