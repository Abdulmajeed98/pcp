import { OutArrow, SubmitOnce } from '@/shared/ui';

// Send on WhatsApp (DESIGN.md's Send on WhatsApp, SHR-5): a cell of the
// Board, 44 pixels tall with 14 pixels at its sides, its words followed by a
// drawn arrow that says it opens a new tab, mirrored in Kurdish and Arabic,
// standing at the end of the row whose start is "Its Parts", never beside it;
// on a line too narrow for both it takes the row, and "Its Parts" the next.
// Its name for a screen reader says where it sends and that it opens a new
// tab. It is a plain form sent with POST, with the Vendor, to a new tab
// (`target="_blank"`), so that it works before any script has loaded and the
// page stays where it was in its own tab: the server shares the Build if
// needed, records a Referral and answers the new tab with WhatsApp's chat.
// With script it says "Opening WhatsApp…" from its first tap and takes no
// second until the page is shown again (Motion 12); without script each tap
// is sent, and is a Referral, as SHR-6 counts taps.
export function SendOnWhatsApp({
  action,
  vendorId,
  words,
}: {
  action: string;
  vendorId: string;
  words: { button: string; busy: string; name: string };
}) {
  return (
    <form
      action={action}
      method="post"
      target="_blank"
      data-testid="send-form"
      className="float-end ms-4 max-w-full"
    >
      <input type="hidden" name="vendor" value={vendorId} />
      <SubmitOnce
        kind="board"
        testId="send-on-whatsapp"
        label={words.name}
        words={{
          idle: (
            <>
              {words.button}
              <OutArrow />
            </>
          ),
          busy: words.busy,
        }}
        className="min-h-control max-w-full px-3.5"
      />
    </form>
  );
}

// In a Vendor's line, in the place of Send on WhatsApp, for a Vendor that
// gave no WhatsApp number: "Gave no WhatsApp number" in Body Soft Ink, so
// that a line with no button is not read as one whose button failed; its
// name still leads to its Vendor page.
export function NoWhatsAppNumber({ words }: { words: string }) {
  return (
    <span
      data-testid="no-whatsapp-number"
      className="float-end ms-4 inline-flex min-h-control max-w-full items-center text-base text-muted-foreground"
    >
      {words}
    </span>
  );
}

// A send refused, said under the Vendor's line in Body, in the page the new
// tab opened at that line (DESIGN.md's Send on WhatsApp): that line alone
// prints in, 150 ms after the first paint, so that the eye finds it, its
// space the page's from the first frame (Motion 12).
export function SendRefusedSaid({ words, id }: { words: string; id?: string }) {
  return (
    <output
      id={id}
      data-testid="send-refused"
      className="prints-under-its-line block scroll-mt-6 text-base"
    >
      {words}
    </output>
  );
}
