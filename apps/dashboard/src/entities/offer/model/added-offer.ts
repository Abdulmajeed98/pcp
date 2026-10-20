// What the Offer form leaves in the address's state after it adds an Offer,
// for the catalog search it returns to: the name of the Part whose Offer was
// added, which the search's note says.
export interface AddedOffer {
  added: string;
}
