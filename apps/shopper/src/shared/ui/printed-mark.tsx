// A printed mark (DESIGN.md's Shapes, Printed marks): a small solid shape in
// the Ink, told from the others by its shape and the glyph cut out of it in
// the paper's colour, never by a colour. A Compatibility Problem is a square
// of 22 pixels with a ✕; a Compatibility Warning a triangle with a !; an
// unchecked rule a ring of 2.6-pixel stroke with a ?; a chosen thing, the
// Build a browser holds, a square with a tick (sharing ticket 04). It stands
// at the start of its line, beside words that say the same, and is hidden
// from readers.
export function PrintedMark({
  kind,
}: {
  kind: 'problem' | 'warning' | 'unchecked' | 'chosen';
}) {
  switch (kind) {
    case 'chosen':
      return (
        <svg
          viewBox="0 0 22 22"
          width="22"
          height="22"
          aria-hidden="true"
          data-mark={kind}
          className="shrink-0"
        >
          <rect width="22" height="22" fill="currentColor" />
          <path
            d="M5.5 11.5l3.6 3.6L16.5 7.6"
            fill="none"
            stroke="var(--card)"
            strokeWidth="2.6"
          />
        </svg>
      );
    case 'problem':
      return (
        <svg
          viewBox="0 0 22 22"
          width="22"
          height="22"
          aria-hidden="true"
          data-mark={kind}
          className="shrink-0"
        >
          <rect width="22" height="22" fill="currentColor" />
          <path d="M7 7l8 8M15 7l-8 8" stroke="var(--card)" strokeWidth="2.6" />
        </svg>
      );
    case 'warning':
      return (
        <svg
          viewBox="0 0 24 22"
          width="24"
          height="22"
          aria-hidden="true"
          data-mark={kind}
          className="shrink-0"
        >
          <path d="M12 1L23.5 21H.5z" fill="currentColor" />
          <path d="M12 8v6M12 16.4v2" stroke="var(--card)" strokeWidth="2.6" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 22 22"
          width="22"
          height="22"
          aria-hidden="true"
          data-mark={kind}
          className="shrink-0"
        >
          <circle
            cx="11"
            cy="11"
            r="9.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
          />
          <path
            d="M8.4 8.6a2.7 2.7 0 1 1 3.6 2.5c-.7.3-1 .8-1 1.5v.6M11 15.6v2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        </svg>
      );
  }
}
