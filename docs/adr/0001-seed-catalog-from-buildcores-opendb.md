# Seed the catalog from BuildCores OpenDB

The catalog of Parts starts as an import of [BuildCores OpenDB](https://github.com/buildcores/buildcores-open-db) (about 26,000 Parts across our eight Categories) instead of being typed in by hand or built up only as Vendors bring stock. Compatibility checking needs structured specs for every Part, and OpenDB already has the fields our rules use, filled in for nearly all Parts; a Vendor adding an Offer will usually find the Part already there.

## Consequences

- OpenDB is licensed under ODC-By 1.0, so the site must credit it publicly for as long as we use data derived from it.
- OpenDB is built around the US market, so Parts sold in Iraq but missing from it are added by the Admin through Part Requests.
- Some fields are sparse (case cooler clearance is filled for about a third of cases), so a Compatibility Rule can be unchecked. The Admin fills gaps when a Part gets its first Offer.
- OpenDB has no images.
