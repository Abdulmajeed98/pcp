// The roots of the dashboard's queries about Parts and about Vendors, kept
// here, below every slice, so that a query about one slice's things that
// another slice asks, such as the catalog search a Vendor's Offers mark, can
// sit under its root as the MVP spec's convention asks, without one slice
// importing another.

// Every query about Parts is under this key, so that a change to any Part
// makes the next search and the next page ask the API again.
export const partsKey = ['parts'] as const;

// Every query about Vendors is under this key, so that a change to any Vendor
// makes the next page of the list and the next Vendor's page ask the API
// again.
export const vendorsKey = ['vendors'] as const;

// The Admin console's Referrals, every Vendor with its Referral count. It
// lists Vendors, so it is under the Vendors' key, and a change to a Vendor,
// such as its name or its deactivation, asks for it again.
export const referralCountsKey = [...vendorsKey, 'referral-counts'] as const;
