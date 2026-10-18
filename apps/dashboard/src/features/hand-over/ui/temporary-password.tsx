// A Login's temporary password, shown this once after a create or a reset,
// beside the hand-over: under its label, in Geist Mono on a Sheet panel, so
// that a and o, or 5 and s, stay apart for the Admin reading it out. The
// screen that shows it holds it alone, and the API answers it nowhere else.
export function TemporaryPassword({ password }: { password: string }) {
  return (
    <section aria-labelledby="temporary-password-label" className="flex flex-col gap-2">
      <h2 id="temporary-password-label" className="text-sm font-medium">
        Temporary password
      </h2>
      <p
        data-testid="temporary-password"
        lang="en"
        dir="ltr"
        className="self-start rounded-lg border border-border bg-card px-3 py-2 font-mono text-2xl font-bold tracking-wider"
      >
        {password}
      </p>
      <p className="text-sm text-muted-foreground">
        Shown this once, and kept nowhere. Leaving this screen loses it. The Vendor replaces
        it with its own at its next login.
      </p>
    </section>
  );
}
