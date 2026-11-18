// What makes the whole row of a list the link to what the row names, on its
// link: the link's box covers the row, which is positioned, and the focus
// outline is drawn inside the row's edges (the dashboard's DESIGN.md, Rows
// and tables). Every list whose row opens something takes it.
export const linkOverRow =
  'after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring';

// A link that is a row's own action beside the link that covers the row,
// such as a Vendor's numbers on Expiring Offers or the Vendor of a Part
// Request on the queue: underlined, as high as a control, and raised above
// the row's link, so that a tap on it opens what it names, and only there.
export const linkAboveRow =
  'hover-colour relative z-10 inline-flex min-h-control items-center underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2';
