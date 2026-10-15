import { CallerPanel } from '@/widgets/caller';

// Placeholder: scaffolding, not a screen. The Admin console's first real page
// replaces it. The Admin console is in English, so the text only it shows is
// written here, and not in the language files.
//
// Its text is set in from the start side. A class that has a side is always
// written that way, with start and end.
export function AdminConsolePlaceholderPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 wrap-break-word">
      <p>Admin console placeholder.</p>
      <CallerPanel />
    </main>
  );
}
