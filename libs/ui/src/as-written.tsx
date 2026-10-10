import type { ComponentProps } from 'react';

// Marks text that is shown as someone wrote it, such as what a Vendor wrote:
// its name, its address and its opening hours (LANG-4). Nobody knows ahead
// which language it is in, so it takes its direction from the text itself.
// The first letter that has a direction decides: a line that starts in
// Arabic script runs right to left, also on an English page, and one that
// starts in Latin script runs left to right, also on a Kurdish page.
//
// It keeps the text apart from the sentence around it, so that neither
// reorders the other. It does so with HTML's own means: `bdi` is the element
// for text to be kept apart, and its direction comes from its text when
// `dir` is `auto`, which is also what `bdi` does when it is given no `dir`.
//
// It has no styling. Such text is never in the language files.
export function AsWritten(props: Omit<ComponentProps<'bdi'>, 'dir'>) {
  return <bdi {...props} dir="auto" />;
}
