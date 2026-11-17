import { SubmitOnce } from '@/shared/ui';

// Share this Build (DESIGN.md's The share button): the Build page's one
// primary button, in Print Green, as wide as the slip and 52 pixels tall, a
// plain form sent with POST to `/<language>/build/share`, so that it works
// before any script has loaded. The server stores the Build as a Shared
// Build, or finds the one this Build was shared as before, and answers with
// its page, whose address is the link. With script it says "Sharing…" from
// its first tap and takes no second (Motion 12). Under it, a share refused
// says why, in Body, as the address after it says.
export function ShareThisBuild({
  action,
  words,
  refused,
}: {
  action: string;
  words: { button: string; busy: string };
  refused: string | undefined;
}) {
  return (
    <div data-line="share" className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <form action={action} method="post" className="grid grid-cols-[minmax(0,1fr)]">
        <SubmitOnce
          kind="primary"
          testId="share-this-build"
          words={{ idle: words.button, busy: words.busy }}
          className="w-full"
        />
      </form>
      {refused !== undefined && (
        <output data-testid="share-refused" className="block text-base">
          {refused}
        </output>
      )}
    </div>
  );
}
