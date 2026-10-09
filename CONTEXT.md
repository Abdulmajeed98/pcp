# PC Part Picker

Helps people in Iraq plan a desktop PC from parts that local vendors actually stock, and compare what each vendor charges for them.

## Language

### Catalog

**Part**:
A specific model of PC component, defined once by the platform together with its specifications (for example "Ryzen 5 7600").
_Avoid_: Product, item, component, listing

**Category**:
The kind of Part: CPU, CPU cooler, motherboard, RAM, storage, GPU, case or PSU.
_Avoid_: Type, group, section

**Part Request**:
A Vendor's request that the Admin add a Part missing from the catalog.
_Avoid_: Suggestion, submission, new part

### Vendors and offers

**Admin**:
The platform's operator, who signs up Vendors, maintains the catalog and sets the Platform Rate.
_Avoid_: Owner, moderator, superuser

**Vendor**:
A business that sells Parts to the public from one location and has agreed to show its Offers on the platform.
_Avoid_: Store, shop, seller, supplier, branch

**Offer**:
One Vendor's price and in-stock status for one Part in new condition.
_Avoid_: Listing, stock, inventory, product

**Confirmation**:
A Vendor's statement that an Offer's price and in-stock status are correct as of that moment.
_Avoid_: Update, refresh, sync

**Expired Offer**:
An Offer hidden from Shoppers because its last Confirmation is too old.
_Avoid_: Stale offer, outdated offer, inactive offer

**Referral**:
One tap by a Shopper on the button that sends their Build to a Vendor over WhatsApp.
_Avoid_: Lead, order, enquiry, click

### Logins

**Login**:
The account in the identity service that the Admin or a Vendor logs in with, holding the role of one or the other. Shoppers have none.
_Avoid_: User, credentials

**Caller**:
The Login a request to the platform's API was made with.
_Avoid_: Current user, principal

### Prices

**Quoted Price**:
A price a Vendor entered for an Offer, in USD or IQD.
_Avoid_: Original price, real price

**Converted Price**:
A price the platform derived from a Quoted Price because the Vendor did not quote that currency.
_Avoid_: Estimated price, approximate price

**Platform Rate**:
The single USD-to-IQD rate behind every Converted Price, set by hand to follow the Erbil market rate.
_Avoid_: Exchange rate, official rate, market rate

### Shoppers and builds

**Shopper**:
A person using the platform to plan a PC and find where to buy its Parts.
_Avoid_: User, customer, builder

**Build**:
A Shopper's chosen set of Parts intended to make one PC.
_Avoid_: Cart, basket, configuration, list

**Complete Build**:
A Build with a CPU, motherboard, RAM, storage, case and PSU, plus a GPU and a CPU cooler where the CPU does not provide them.
_Avoid_: Finished build, valid build

**Compatibility Rule**:
A check that Parts in the same Build fit and work together; it is unchecked when a specification it needs is missing.
_Avoid_: Validation, constraint

**Compatibility Problem**:
A Compatibility Rule that the Parts in a Build fail, meaning they will not fit or work together.
_Avoid_: Conflict, error, incompatibility

**Compatibility Warning**:
A Compatibility Rule finding that the Parts in a Build work only if a stated condition holds, such as using an adapter supplied with the Part.
_Avoid_: Note, notice, caution
