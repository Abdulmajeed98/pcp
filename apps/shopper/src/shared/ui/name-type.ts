// The type a name is set in where it is a piece's title (DESIGN.md's The
// Long Name Rule): the Sheet title while it is short, and the Facts size past
// 40 characters, so that a long name reads as a name and never as a poster.
// A Part's name, which the catalog writes as long as 276 characters, takes
// the Title size past 80, so that it reads as a paragraph, on the square
// plate and the box label; a Vendor's, 100 characters at most, keeps the
// Facts size on its coupon, its `smallest`.
export function nameType(name: string, smallest: 'title' | 'facts' = 'title'): string {
  if (smallest === 'title' && name.length > 80) return 'text-xl font-semibold';
  if (name.length > 40) return 'type-facts';
  return 'type-sheet-title';
}
