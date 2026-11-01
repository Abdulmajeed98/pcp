import { createContext, useContext } from 'react';
import type * as React from 'react';

// Whether a screen is shown beside a list, as a Part beside the Catalog or a
// Vendor beside the Vendors on a screen as wide as a desk's.
const BesideAList = createContext(false);

// Marks the screen opened beside a list: the list keeps the page's one
// first-level title, and the screen's own title is of the second level
// under it (the owner's word on 22 October 2026, "h2 on a desk", redesign
// ticket 08). A list that opens its screens beside it wraps them in this
// only when it shows them so; on a phone the screen stands alone.
function OpenedBesideAList({ children }: { children: React.ReactNode }) {
  return <BesideAList.Provider value>{children}</BesideAList.Provider>;
}

// A screen's title: the page's `h1` when the screen stands alone, and an
// `h2` when it is opened beside a list. It looks the same either way; the
// caller gives its type, such as `screen-title`.
function ScreenTitle(props: React.ComponentProps<'h1'>) {
  const Heading = useContext(BesideAList) ? 'h2' : 'h1';
  return <Heading {...props} />;
}

// A section's title within a screen, one level under the screen's own: an
// `h2` when the screen stands alone, and an `h3` when it is opened beside a
// list and titles itself `h2`, so that every opened screen keeps its
// headings in order whichever way it is shown. It looks the same either
// way; the caller gives its type.
function SectionTitle(props: React.ComponentProps<'h2'>) {
  const Heading = useContext(BesideAList) ? 'h3' : 'h2';
  return <Heading {...props} />;
}

export { OpenedBesideAList, ScreenTitle, SectionTitle };
