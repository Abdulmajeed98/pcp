// Whether the API's answer says an address names nothing a Shopper may see:
// it answers 404 to a Part or Vendor it does not show, as an unknown one,
// and 400 to an identifier it cannot read. A page asked for one answers the
// "not found" page with the status 404.
export function namesNothingShown(status: number | undefined): boolean {
  return status === 404 || status === 400;
}
