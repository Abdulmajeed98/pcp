// The link, printed (DESIGN.md's The Shared Build page): "The link" in Small
// Soft Ink, then the address itself in Body, one left-to-right line that
// breaks anywhere, selected whole by one long press or click, which is how
// it is copied without script. It stands on a Shared Build's sheet, under
// the note of when it was shared.
export function PrintedLink({ link, label }: { link: string; label: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-1 text-start">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p data-testid="the-link" className="printed-link text-base">
        {link}
      </p>
    </div>
  );
}
