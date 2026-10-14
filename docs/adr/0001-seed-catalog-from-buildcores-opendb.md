# Seed the catalog from BuildCores OpenDB

The catalog of Parts starts as an import of [BuildCores OpenDB](https://github.com/buildcores/buildcores-open-db) instead of being typed in by hand or built up only as Vendors bring stock. At the commit the import reads, OpenDB's folders for our eight Categories hold 26,240 records, and 26,212 of them become Parts. Compatibility checking needs structured specs for every Part, and OpenDB already has the fields our rules use, filled in for nearly all Parts; a Vendor adding an Offer will usually find the Part already there.

## Amended 14 October 2026: OpenDB's licence changed

This ADR chose OpenDB because it was licensed under ODC-By 1.0, which allows commercial use with attribution. On 5 October 2026 OpenDB moved to CC BY-NC-SA 4.0, which is non-commercial and share-alike, and on 9 October its notice was reworded to cover all of its data.

- The catalog is imported from one pinned commit, `ef7e601b78875a931a4ad9fa1ccce7000f3e5ecf` of 5 October 2026, the last released under ODC-By 1.0. The owner chose it on 14 October 2026.
- The commit is written in one place, the `@pcp/opendb` library, and the import refuses data that is not from it.
- OpenDB's later data is under CC BY-NC-SA 4.0 and is not used without the owner's agreement. Pulling updates from OpenDB was already outside the MVP. It now needs a licence decision as well.

## Consequences

- OpenDB at the pinned commit is licensed under ODC-By 1.0, so the site must credit it publicly for as long as we use data derived from it. The credit links to OpenDB at that commit.
- OpenDB is built around the US market, so Parts sold in Iraq but missing from it are added by the Admin through Part Requests.
- Some fields are sparse (case cooler clearance is filled for about a third of cases), so a Compatibility Rule can be unchecked. The Admin fills gaps when a Part gets its first Offer.
- OpenDB has no images.
