import { SectionTitle } from '@/shared/ui';

// A Login's temporary password, shown this once after a create or a reset,
// beside the hand-over: under its label, in Geist Mono at 1.5rem, weight
// 700, on a Raised Stone panel with 8-pixel corners and no edge, never on a
// plate (DESIGN.md's Typography), so that a and o, or 5 and s, stay apart for
// the Admin reading it out. The screen that shows it holds it alone, and the
// API answers it nowhere else.
export function TemporaryPassword({ password }: { password: string }) {
  return (
    <section aria-labelledby="temporary-password-label" className="flex flex-col gap-2">
      <SectionTitle id="temporary-password-label" className="text-sm font-medium">
        Temporary password
      </SectionTitle>
      <p
        data-testid="temporary-password"
        lang="en"
        dir="ltr"
        className="max-w-full self-start rounded-card bg-secondary px-4 py-2.5 font-mono text-2xl font-bold tracking-wider wrap-anywhere"
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
