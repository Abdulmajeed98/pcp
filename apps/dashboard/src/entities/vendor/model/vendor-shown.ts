import { useOutletContext } from 'react-router';

// The Vendor whose portal is shown, as each screen of the Vendor portal
// learns it. The frame its screens are mounted in gives it to them through
// its `<Outlet context>`: the Vendor portal's frame the Caller's own Vendor,
// and the Admin console's, when the Admin acts as a Vendor, the one in its
// address. So the same screen serves both.
export interface VendorShown {
  vendorId: string;
}

export function useVendorShown(): VendorShown {
  return useOutletContext<VendorShown>();
}
