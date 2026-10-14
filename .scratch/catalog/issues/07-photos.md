# 07: Photos through the API

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin adds a photo to a Part, straight from a phone's camera, and can replace it. The photo is made small enough for slow mobile data, re-encoded as WebP, and stripped of the place it was taken and the device that took it. Anyone can fetch it, at an address that holds the photo's own identifier, with an answer that may be cached for a year. A replaced photo gets a new address. The Part's answer and the search results carry the photo's address.

Photos are kept in PostgreSQL behind an abstract `PhotoStore`, which is the port, as the owner chose on 14 October 2026. An object store can replace it later without a change to the domain.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Before anything is written, these are read for the releases that will be installed, and the findings are recorded under Comments:
  - sharp's documentation on resizing, on WebP output and on metadata, and on its limit on the number of pixels it will read;
  - NestJS's documentation on file uploads;
  - the workplace's document on file uploads, for its content check. It is read, and nothing is copied.
- [ ] sharp 0.35 is added. Its install script is read before it is listed.
- [ ] It is found out and recorded whether sharp's prebuilt binaries install and load on the owner's Mac and in a Linux `node:24` container.
- [ ] `AddPartPhotoCommand`, a `PhotoStore` port and a database implementation of it, and a generated migration for the photos' table.
- [ ] Only the Admin may add a photo. A JPEG, a PNG or a WebP image of up to 10 MB is accepted, judged by its content and not by its name. Anything else is refused, and so is a larger file.
- [ ] The stored photo is at most 1,200 pixels on its longer side, never enlarged, WebP, and carries no metadata at all.
- [ ] Adding a photo to a Part that has one replaces it, and the old one is deleted.
- [ ] A public endpoint serves a photo at an address that holds the photo's identifier. Its answer says that it may be cached for a year and never changes. An address of a deleted photo is answered 404.
- [ ] The Part's answer and each search result carry the photo's address when there is one.
- [ ] `pnpm api-client:write` is run, and the description and the client are committed.
- [ ] `pnpm integration:check` passes with these tests, with images made up in the test:
  - A large JPEG that carries location data is served as WebP, no longer than 1,200 pixels on its longer side, with no metadata.
  - A small image is not enlarged.
  - A text file named like a picture is refused, and so is an image over 10 MB.
  - A replaced photo has a new address, and the old address answers 404.
  - The photo is served without a token, and its answer may be cached for a year.
  - A Vendor's attempt to add a photo is answered 403. Without a token it is answered 401.
- [ ] Shown once and then reverted, each failing its own test: the metadata kept; the content check replaced by the file's name; the old photo left in place after a replacement.
- [ ] `pnpm check` passes with Docker stopped.
- [ ] The results of the fault checks are recorded under Comments.
- [ ] The work is committed in pieces, each leaving `pnpm check` passing.
