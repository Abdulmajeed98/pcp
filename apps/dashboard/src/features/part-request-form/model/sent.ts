// What sending a Part Request leaves in the address's state, for the
// Vendor's Part Requests it returns to: the request that was sent, whose
// name the list's note says and whose row arrives first in the list.
export interface SentPartRequest {
  sent: { id: string; name: string };
}
