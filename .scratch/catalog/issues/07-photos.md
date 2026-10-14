# 07: Photos through the API

**Spec:** [the catalog spec](../spec.md)

**What to build:** The Admin adds a photo to a Part, straight from a phone's camera, and can replace it. The photo is made small enough for slow mobile data, re-encoded as WebP, and stripped of the place it was taken and the device that took it. Anyone can fetch it, at an address that holds the photo's own identifier, with an answer that may be cached for a year. A replaced photo gets a new address. The Part's answer and the search results carry the photo's address.

Photos are kept in PostgreSQL behind an abstract `PhotoStore`, which is the port, as the owner chose on 14 October 2026. An object store can replace it later without a change to the domain.

**Blocked by:** 06

**Status:** resolved

- [x] Before anything is written, these are read for the releases that will be installed, and the findings are recorded under Comments:
  - sharp's documentation on resizing, on WebP output and on metadata, and on its limit on the number of pixels it will read;
  - NestJS's documentation on file uploads;
  - the workplace's document on file uploads, for its content check. It is read, and nothing is copied.
- [x] sharp 0.35 is added. Its install script is read before it is listed.
- [x] It is found out and recorded whether sharp's prebuilt binaries install and load on the owner's Mac and in a Linux `node:24` container.
- [x] `AddPartPhotoCommand`, a `PhotoStore` port and a database implementation of it, and a generated migration for the photos' table.
- [x] Only the Admin may add a photo. A JPEG, a PNG or a WebP image of up to 10 MB is accepted, judged by its content and not by its name. Anything else is refused, and so is a larger file.
- [x] The stored photo is at most 1,200 pixels on its longer side, never enlarged, WebP, and carries no metadata at all.
- [x] Adding a photo to a Part that has one replaces it, and the old one is deleted.
- [x] A public endpoint serves a photo at an address that holds the photo's identifier. Its answer says that it may be cached for a year and never changes. An address of a deleted photo is answered 404.
- [x] The Part's answer and each search result carry the photo's address when there is one.
- [x] `pnpm api-client:write` is run, and the description and the client are committed.
- [x] `pnpm integration:check` passes with these tests, with images made up in the test:
  - A large JPEG that carries location data is served as WebP, no longer than 1,200 pixels on its longer side, with no metadata.
  - A small image is not enlarged.
  - A text file named like a picture is refused, and so is an image over 10 MB.
  - A replaced photo has a new address, and the old address answers 404.
  - The photo is served without a token, and its answer may be cached for a year.
  - A Vendor's attempt to add a photo is answered 403. Without a token it is answered 401.
- [x] Shown once and then reverted, each failing its own test: the metadata kept; the content check replaced by the file's name; the old photo left in place after a replacement.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 14 October 2026: completed

**For the owner to decide.**

- **HEIC, the format an iPhone's camera uses, is refused,** as the spec's three formats say. Story 50 needs a photo straight from a phone's camera to be accepted, so ticket 13's form should ask the browser for JPEG, PNG or WebP. Safari on an iPhone then converts HEIC to JPEG as it sends it. Chrome on Android does not convert, but Android cameras take JPEG by default.
- **A photo's address is a path on the API,** `/v1/photos/<id>`, which a frontend puts the API's own address in front of. The API does not know the address it is reached at.
- **Every refusal of a picture has one shape:** `NOT_VALID`, with `field: 'photo'` and a `reason`:

  | Reason | When |
  |---|---|
  | `missing` | No file was sent, or it was sent under another name |
  | `tooLarge` | The file is over 10 MB. Multer stops one over 12 MB before it is all received, and an interceptor gives that the same answer. |
  | `notAPhoto` | It is not a JPEG, a PNG or a WebP image, or it cannot be decoded |
  | `tooManyPixels` | It is over 100 million pixels |

- **The largest number of pixels is 100 million.** Decoding that takes about 300 MB, on the 4 GB server the spec plans. A phone's 200-megapixel picture is refused, but such a picture is over 10 MB anyway.
- **Photos are kept in a table of their own,** one row for each Part at most, behind the `PhotoStore` port.
  - A replacement deletes the old row and stores a new one, so a new photo has a new address and a cached one is never stale.
  - Two replacements sent at once, as by a double tap, wait for each other on the Part's row.

**Found out first.**

- **sharp:**
  - Its output keeps no metadata unless asked, and the EXIF orientation is among what it drops, so a photo is turned upright with `rotate()` first.
  - It tells the format from the picture's content.
  - Its limit on pixels already applies to reading a picture's header. The header is therefore read without the limit, which decodes nothing, and the size is checked by the API.
- **NestJS:** Multer keeps an upload in memory unless told otherwise, and has no size limit of its own. A file over the limit set is answered 413 before the endpoint is reached.
- **The workplace's document on file uploads** was read, and nothing was copied. Its processing step returns an `Either`. Here the processor returns either the photo or a refusal, and the use case turns a refusal into the error.
- **sharp 0.35.5 has no install script.** It loads a prebuilt binary on the owner's Mac and in a Linux `node:24-slim` container, both arm64. `pnpm-workspace.yaml` already listed it as not to be run.
- **Drizzle 0.45 has no column for bytes,** so the table uses a small custom type, `bytea`.

**The code review found:**

- every error of sharp's turned into `notAPhoto` without a word in the log;
- a picture with too many pixels answered as not a photo;
- Multer's own refusals answered in other shapes: `HTTP_413`, or a 400 that named nothing;
- two replacements at once able to collide on the one-photo rule and answer 500;
- the photo's code split between the Part's folders and its own;
- `@types/multer` added and unused.

All are corrected. The review also ran the real pipeline: a CMYK JPEG and a Display-P3 image come out in sRGB with no profile, a 16-bit PNG in 8 bits, an animated WebP as its first frame, and GIF, TIFF, SVG and AVIF are refused.

Running the checks after the review found one more thing: sharp's limit refused the header before the API's own check could name the reason. That is corrected too.

**Faults.** Each was planted by a script that refused a dirty tree, made one exact edit, ran the tests and undid the edit. `git status` was clean after every one.

| Fault | Failed |
|---|---|
| The metadata kept | "is stored small, as WebP, with no metadata at all", and nothing else |
| The content check replaced by the file's name | "is judged by its content and not by its name", and nothing else |
| A replacement that rewrites the old photo in place, at its old address | "replaces the one a Part had, at a new address, and the old address answers 404", and nothing else |

The ticket's own wording of the third, "the old photo left in place after a replacement", cannot be planted as written: the table allows one photo for each Part, so the old row cannot stay beside a new one. The in-place rewrite is the fault that keeps that rule and still breaks what the test guards: a new address for a new photo.

**Results.**

- `pnpm check` passes.
- `pnpm integration:check` passes 80 tests, 14 of them about photos.
- `pnpm platform:check` passes 29 tests.
- The development database gained the photos' table through `pnpm db:migrate`.
