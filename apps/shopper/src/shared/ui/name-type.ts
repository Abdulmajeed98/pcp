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

// The type of a name that is its piece's title where a phone's largest text
// narrows the piece, the Vendor's coupon and the Part's plate: as
// `nameType`, and a name in the Sheet title takes the Facts size on a piece
// narrower than 12em of its own text, which only such text makes, so that a
// long word keeps whole where that size holds it, and breaks where it must
// where even that cannot (the owner's choice of 16 November 2026, follow-up
// ticket 12). The piece is the container named `piece`; at the text's own
// size none is that narrow, and a name already smaller keeps its size.
export function nameTypeOnANarrowPiece(
  name: string,
  smallest: 'title' | 'facts' = 'title',
): string {
  const type = nameType(name, smallest);
  return type === 'type-sheet-title' ? `${type} @max-[12em]/piece:type-facts` : type;
}
