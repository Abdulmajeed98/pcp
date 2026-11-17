import { buttonVariants, FoldItAgain, SubmitOnce } from '@/shared/ui';

// Copy into my Build (DESIGN.md's The Shared Build page): the page's one
// primary button, in Print Green, as wide as the slip and 52 pixels tall, a
// plain form sent with POST to `/<language>/builds/<id>/copy`, which writes
// the copy into the browser's cookie and is answered with the Build page.
//
// When the browser holds a Build of its own, the copy replaces it, so it
// asks once first, confirmed in place as emptying the Build is: Copy into my
// Build is the summary of a disclosure, which works before any script has
// loaded. Opened, it says in Body large what it does and that nothing brings
// the Parts back, and offers "Replace my 5 Parts", in the Ink with the
// paper's colour, the form's button, and under it "Keep mine", a cell of the
// Board, each as wide as the slip and 12 pixels apart, which folds it again: in place with script, and without it as a link to
// the Shared Build page, which opens folded. Its space opens and folds as
// Empty the Build's does, in 150 ms each way with reduced motion
// (`data-confirmation`). When the browser's Build is empty it copies at
// once, with no question, since nothing is lost. With script the button
// that sends the form says "Copying…" from its first tap and takes no second
// (Motion 12).
export function CopyIntoMyBuild({
  action,
  sharedBuildAddress,
  ownParts,
  words,
}: {
  action: string;
  sharedBuildAddress: string;
  // How many Parts the browser's own Build holds, each once.
  ownParts: number;
  words: { button: string; busy: string; warning: string; confirm: string; keep: string };
}) {
  if (ownParts === 0) {
    return (
      <form action={action} method="post" className="grid grid-cols-[minmax(0,1fr)]">
        <SubmitOnce
          kind="primary"
          testId="copy-into-my-build"
          words={{ idle: words.button, busy: words.busy }}
          className="w-full"
        />
      </form>
    );
  }

  return (
    <details
      data-testid="copy-into-my-build"
      data-confirmation=""
      className="unfolds-in-place text-center"
    >
      <summary
        className={buttonVariants({
          kind: 'primary',
          className: 'flex w-full list-none [&::-webkit-details-marker]:hidden',
        })}
      >
        {words.button}
      </summary>
      <div className="grid grid-cols-[minmax(0,1fr)] justify-items-center gap-4 pt-4">
        <p className="text-lg text-balance">{words.warning}</p>
        <form
          action={action}
          method="post"
          className="grid w-full grid-cols-[minmax(0,1fr)] gap-3"
        >
          <SubmitOnce
            kind="ink"
            testId="copy-confirm"
            words={{ idle: words.confirm, busy: words.busy }}
            className="w-full"
          />
          <FoldItAgain
            href={sharedBuildAddress}
            testId="keep-mine"
            className={buttonVariants({ kind: 'board', className: 'w-full' })}
          >
            {words.keep}
          </FoldItAgain>
        </form>
      </div>
    </details>
  );
}
