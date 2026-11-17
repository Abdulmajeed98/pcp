// An arrow out of the page, toward the end side and up, after a link or a
// button that opens a new tab, as Open in Google Maps on a Vendor's coupon
// and Send on WhatsApp on a Vendor's line do: drawn, since none of the
// page's faces draws an arrow, mirrored in Kurdish and Arabic, and hidden
// from readers, the control saying in words that it opens a new tab.
export function OutArrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      data-testid="out-arrow"
      className="size-4 shrink-0 rtl:-scale-x-100"
    >
      <path
        d="M4 12 L12 4 M6 4 H12 V10"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
      />
    </svg>
  );
}
