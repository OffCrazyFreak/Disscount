# Disscount: Image Uploads

How every photo a user or admin uploads is shrunk, cleaned and checked, in the browser and again on the server.

## 1. Quick reference

| Question                                   | Answer                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Which uploads exist?                       | The profile avatar, wallet card photos (front, back, icon) and product photos. The scanner's "pick an image" never leaves the device |
| Is every upload compressed in the browser? | Yes, all three go through `utils/browser/image.ts`                                                                                   |
| Is location (GPS) and other EXIF removed?  | Yes, twice: the browser re-encodes from a canvas, and the server rewrites the bytes again                                            |
| Are phone photos upright?                  | Yes, decoding applies the EXIF rotation before the metadata is dropped                                                               |
| Which formats reach the server?            | WebP or JPEG. Never PNG, SVG or HEIC                                                                                                 |
| Does it need a library?                    | No. The browser uses `createImageBitmap` and a canvas; the server uses ImageIO for JPEG and a hand-written RIFF walker for WebP      |

## 2. The shared browser pipeline

`frontend/src/utils/browser/image.ts` holds the steps every upload shares:

- `decode(file)` calls `createImageBitmap(file, { imageOrientation: "from-image" })`, so a sideways phone photo is turned upright. A file the browser cannot decode throws `ImageProcessingError("cannotOpen")`.
- `scaled(bitmap, longEdge)` fits the long edge, never upscaling. `centerCropped(bitmap, size)` takes the centred square. Both draw with high quality smoothing, which matters when a 4000 px photo becomes 256 px.
- `encodeWebpOrJpeg(canvas, quality)` asks for WebP and falls back to JPEG when the browser hands back anything else (Safari, see [§6](#6-gotchas)). `encodeJpeg(canvas, quality)` paints white behind transparency first, since JPEG has no alpha.
- `firstWithinLimit(attempts, encode, limit)` tries smaller sizes or lower quality in order until a blob fits under the server limit.

Re-encoding from a canvas is what strips metadata: the canvas holds pixels only, so EXIF, GPS, XMP and embedded thumbnails never reach the new file.

Errors carry a code (`cannotOpen`, `cannotProcess`, `cannotSave`, `tooLarge`) and each feature translates it with its own messages.

## 3. Per upload settings

| Upload              | Helper                           | Size                                      | Format                        | Byte budget                                               |
| ------------------- | -------------------------------- | ----------------------------------------- | ----------------------------- | --------------------------------------------------------- |
| Avatar              | `utils/browser/avatar-image.ts`  | Centred 256 px square                     | WebP 0.8, JPEG 0.8 fallback   | None needed (about 15 to 30 KB)                           |
| Card front and back | `utils/browser/card-image.ts`    | 1280 px long edge plus a 320 px thumbnail | WebP 0.75, JPEG 0.78 fallback | Under 480 KB, stepping down to 0.65, 0.55, then 1024 px   |
| Card icon           | `utils/browser/card-image.ts`    | Centred 128 px square                     | WebP 0.75, JPEG 0.78 fallback | None needed                                               |
| Product photo       | `utils/browser/product-photo.ts` | 2048 px long edge                         | JPEG 0.82 always              | Under 480 KB, stepping down to 0.7, then 1600 and 1280 px |

Why they differ:

- The avatar shows at most 96 CSS px in a round frame, so a square crop at 256 px stays sharp on a 2x screen and stores nothing that is never seen.
- Card photos keep 1280 px so the card number and barcode stay readable to a person. The wallet never scans the photo: the barcode on the card face is drawn from the stored number.
- Product photo uploads are always JPEG because the server's renderer decodes only JPEG and PNG, and the admin crops from the original, so it keeps the most pixels. The public files it renders are WebP ([PRODUCT-IMAGES.md](PRODUCT-IMAGES.md)).

Offline card photos sit in IndexedDB (`lib/offline/card-photo-outbox.ts`) as the already prepared blobs, so the queue holds the small, clean copies, never the original file.

## 4. What the server does

The browser steps are a convenience; the server check is the real guard, because a client can skip them.

| Upload        | Endpoint                                    | Server limit                                                                                        | What happens to the bytes                                                                                                                                |
| ------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Avatar        | `PATCH /api/users/me` (JSON field `image`)  | 400,000 characters of data URI (`UserRequest`), then `PhotoValidator`: WebP or JPEG, 2048 px a side | `AvatarSanitizer` decodes the data URI, runs `PhotoValidator`, and stores a new data URI labelled by the real format in Postgres                         |
| Card photos   | `PUT /api/digital-cards/{id}/photos/{slot}` | Spring multipart `max-file-size=512KB`, `max-request-size=1100KB`, then `PhotoValidator`            | Sanitised bytes go to the private R2 card bucket                                                                                                         |
| Product photo | `POST /api/products/{ean}/images`           | The same multipart limits and `PhotoValidator`, then JPEG only                                      | Sanitised original kept, then `ProductImageRenderer` writes 1080 and 400 px JPEGs on white to the public bucket ([PRODUCT-IMAGES.md](PRODUCT-IMAGES.md)) |

`PhotoValidator` (`backend/.../digitalCard/photo/`) decides the format from the first bytes, never from the claimed type or file name. JPEG is decoded and re-encoded with ImageIO, which drops metadata; it starts at quality 0.85 and steps down to 0.50 until the result is no bigger than the upload, because a phone JPEG is often already below 0.85 and the first step alone made files bigger (27 to 37% on real dev photos, 45% on a noisy test image). When no step is small enough the smallest is kept, so a JPEG uploaded below quality 0.50 can still grow slightly. The 512 KB limit is checked again on the bytes that get stored. WebP is rewritten keeping only the pixel chunks (`VP8X`, `VP8 `, `VP8L`, `ALPH`), which drops EXIF, XMP and ICC. [DIGITAL-CARDS.md §5](DIGITAL-CARDS.md#5-photos-and-r2) lists every rule.

## 5. Key files

| File                                                                  | Role                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------ |
| `frontend/src/utils/browser/image.ts`                                 | Shared decode, resize, encode and size stepping        |
| `frontend/src/utils/browser/avatar-image.ts`                          | Avatar settings                                        |
| `frontend/src/utils/browser/card-image.ts`                            | Card photo settings                                    |
| `frontend/src/utils/browser/product-photo.ts`                         | Product photo settings                                 |
| `frontend/src/components/custom/settings/components/avatar-field.tsx` | Avatar picker; turns the blob into a data URI          |
| `backend/.../digitalCard/photo/PhotoValidator.java`                   | Format sniffing, size and dimension checks, sanitising |
| `backend/.../user/avatar/AvatarSanitizer.java`                        | Data URI in, sanitised data URI out                    |

## 6. Gotchas

- **Safari returns PNG for a WebP request.** `canvas.toBlob(cb, "image/webp")` silently gives PNG on every Safari and iOS browser, and the server rejects PNG. `encodeWebpOrJpeg` checks `blob.type` and falls back to JPEG. Never remove that check. Before this, Safari avatars were stored as PNG.
- **A new upload path must go through `image.ts` and `PhotoValidator`.** Skipping either one lets GPS metadata or an unchecked format through.
- **The avatar 15 MB check in `avatar-field.tsx` only guards decoding.** The stored size comes from the re-encode.

## 7. Future work

- Moving avatars from Postgres base64 to the public bucket is decided and planned as its own PR; `AvatarSanitizer` already hands back clean bytes that could be stored there.
