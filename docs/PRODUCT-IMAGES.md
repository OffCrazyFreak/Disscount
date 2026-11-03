# Product images

How Disscount shows product photos: where they come from, how they are stored and rendered, who can change them, and what has to be set up by hand.

> **Mental model in one sentence:** every product (EAN) keeps a list of candidate photos from Open Food Facts and from users; one of them is the main photo, each is rendered from its untouched source into two square JPEGs on baked-in white in a public R2 bucket, and the admin curates the list from the product page or from a popularity-ordered queue in the dashboard.

---

## 1. Quick reference

| Thing              | Value                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Sources            | Open Food Facts (CC BY-SA, credited in the terms of service) and photos uploaded by users and admins      |
| Storage            | Public R2 bucket (EU jurisdiction) behind its own domain; user originals in the private card photo bucket |
| Files served       | `products/<ean>/<hash>.jpg` (up to 1080 px square) and `-thumb.jpg` (up to 400 px), cached for a year     |
| Viewer             | `yet-another-react-lightbox` with the zoom, thumbnails and counter plugins                                |
| Crop               | `react-image-crop` in the admin; the backend renders the crop from the original                           |
| Env vars           | `R2_PUBLIC_BUCKET`, `R2_PUBLIC_ACCESS_KEY_ID`, `R2_PUBLIC_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` (backend)   |
| Off switch         | Any of the four blank: no photos anywhere, uploads answer 503, jobs do nothing                            |
| Admin entry points | "Uredi slike" on a product page, and the "Slike proizvoda" tab in `/dashboard`                            |

---

## 2. Where photos come from

The cijene API has no images at any layer, so photos come from outside it.

- **Open Food Facts.** A weekly job streams their full product export (about 1.5 GB gzipped) and keeps the selected front photo of every EAN in our catalogue. In November 2026 that matched about 30,000 of 222,000 catalogue EANs (13.5%), about half of the products sold in ten or more chains, and 69% of the products users had saved. Croatian barcodes (prefix 385) were only 4.3% covered. "Dohvati s Open Food Factsa" in the admin editor reads one product through their API and adds every front photo (one per photo, Croatian first) and up to 30 recent raw photos as candidates.
- **Users.** A logged-in user uploads a JPEG prepared in the browser (long edge up to 2048 px, under 480 KB, white behind any transparency; see [IMAGE-UPLOADS.md](IMAGE-UPLOADS.md)).
- **Admins.** Same upload, but verified and pinned as the main photo straight away.

Their API allows 15 product reads a minute per IP and may ban an IP that goes over, so we cap ourselves at 10 a minute and never call it when a page opens.

## 3. States and the main photo

| Status      | Meaning                                                      | Shown to users                                |
| ----------- | ------------------------------------------------------------ | --------------------------------------------- |
| `CANDIDATE` | Known on Open Food Facts, not copied into our bucket yet     | no                                            |
| `PENDING`   | A user photo nobody has confirmed                            | only while it is the main photo, with a badge |
| `VERIFIED`  | Open Food Facts, admin, or a confirmed user photo            | yes                                           |
| `HIDDEN`    | Hidden by the admin, or skipped because it could not be read | no                                            |

- A user's photo confirms any other user's pending photo of the same EAN: two different people uploaded from the same barcode page. The pixels are not compared.
- An admin's choice confirms a pending photo. Setting a main photo pins it, and automatic picks never replace a pinned one.
- Without a pin, the main photo is the best of: an admin photo, a Croatian front, an English front, any front, a verified user photo, an uncopied front (which the background job copies next), then a pending user photo. A new upload never takes the main spot from an uncopied front, so an Open Food Facts photo is not pushed out by an unconfirmed one.
- Hiding the main photo unpins and hands the choice back to the automatic pick.

## 4. Rendering and the white background

`ProductImageRenderer` decodes the source (JPEG or PNG, at most 10,000 px a side and 24 megapixels), paints it on white, rotates by a multiple of 90 degrees, crops, centres it on a white square with a 4% margin and writes 1080 and 400 px JPEGs. It never upscales. The crop is stored as `x, y, width, height` in pixels of the rotated original plus the rotation, like Open Food Facts stores it, so a new crop always starts from the original.

The white is part of the file on purpose. Dark Reader's default mode recolours CSS backgrounds but leaves image pixels alone, its filter modes and iOS Smart Invert invert images back, and Windows forced colours keeps images. The tile around a photo is a plain `<img>` (never a CSS background, which Dark Reader hides or inverts), with `color-scheme: only light` so Chrome's auto dark mode leaves it alone and `forced-color-adjust: none` for high contrast. Samsung Internet's forced dark still greys whites inside images and cannot be opted out of.

## 5. Background jobs

All in `ProductImageJobs`, all off when `product-images.jobs.enabled=false` (the test profile). Without the public bucket only the catalogue part of the weekly import runs, because the product sitemap reads it; the Open Food Facts seed and photo copying wait for the bucket.

| Job                | When                                                         | What                                                                                                              |
| ------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Weekly import      | checked every 6 h, runs when the last run is over 7 days old | cijene archive into `product_image_set` (name, brand, store listings, chain count), then the Open Food Facts seed |
| Render main photos | every 15 s, 10 at a time                                     | copies uncopied main photos into the bucket, most widely sold first, one download at a time                       |
| Limiter sweep      | every 5 min                                                  | clears the upload rate limiter                                                                                    |

The last import is stored in `product_image_import_run`, so a redeploy does not download the export again. A photo that cannot be read, is gone on Open Food Facts (404 or 410), is over the download size cap or has a key that forms no valid URL is hidden so it cannot block the queue (`hidden_reason` `JOB_SKIPPED`), and comes back as a candidate when the weekly seed or "Dohvati" finds a new revision of it. A photo the admin hid (`ADMIN`, or no reason on rows hidden before the column existed) never comes back on its own. Any other answer for one image (a 403, a 500) postpones just that photo for an hour (`render_retry_at`), and the fifth such failure (`render_attempts`) skips it so the next pick or a user upload takes the main slot, while rate limiting (429), gateway errors (502 to 504) and network or bucket trouble pause the batch and retry at the next tick. A download can take seconds, so the job reads the row again before it writes and drops its result when an admin or the import changed the photo meanwhile (no longer an uncopied candidate, a new revision, or a new crop), so an admin hide is never turned back into `JOB_SKIPPED` or published. A successful copy clears `render_attempts` and `render_retry_at`. Replaced files are deleted only after the database commit, so a rolled back crop never loses the files its row still points at. The jobs share a scheduler pool of four threads (`spring.task.scheduling.pool.size`), so the long weekly import never holds back card purges or photo copying.

## 6. API

Public (no login): `GET /api/products/{ean}/images`, `GET /api/products/images/thumbnails?eans=a,b` (up to 100; malformed EANs are left out, not rejected) and `GET /api/products/catalog/eans` (every EAN with `store_listings > 0`, read by the frontend's product sitemap). Logged in: `POST /api/products/{ean}/images` (multipart field `photo`, JPEG, 10 per 10 minutes per user, admins exempt) and `POST /api/products/images/{id}/report` (once per user and photo).

Admin, under `/api/admin/product-images`: `GET /queue?filter=todo|pending|reported&page&size`, `GET /{ean}`, `POST /{ean}/refresh`, `PUT /{ean}/main`, `POST /{ean}/reviewed`, `PUT /images/{id}/status` (`VERIFIED` also clears reports, or `HIDDEN`), `PUT /images/{id}/crop`, `GET /images/{id}/original` (the private original, for the crop screen).

## 7. Frontend

- **Product page:** `ProductPhotoGallery` beside the price table (above it on phones): the main photo opens the viewer, thumbnails switch it, "Dodaj sliku" uploads (or opens sign-in), "Uredi slike" opens the admin editor. Back closes the viewer (`use-back-closes.ts`, the same history marker pattern as the modal URLs).
- **Viewer toolbar:** "Prijavi sliku" for logged-in users, and a star for admins that sets the photo on screen as the main one.
- **Lists:** `ProductCard` asks for its own thumbnail; `thumbnail-batcher.ts` gathers the asks of a whole list into one request.
- **Dashboard:** the "Slike proizvoda" tab lists products most widely sold first, with the same editor beside the list. J and K move, R marks reviewed and moves on.

## 8. Key files

| File                                                             | What                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `backend/.../productImage/render/ProductImageRenderer.java`      | Decode, rotate, crop, white square, JPEG                                 |
| `backend/.../productImage/service/`                              | Reads, uploads, admin actions, jobs, the main photo rules (`MainPicker`) |
| `backend/.../productImage/off/`                                  | Open Food Facts client, URL layout, export reader                        |
| `backend/.../productImage/catalog/`                              | cijene archive reader and import                                         |
| `backend/.../storage/R2Clients.java`                             | The S3 client both buckets use                                           |
| `frontend/src/components/custom/product-photos/`                 | Tile, viewer, upload, admin editor, crop                                 |
| `frontend/src/app/[locale]/products/components/product-photos/`  | The product page gallery                                                 |
| `frontend/src/app/[locale]/dashboard/components/product-photos/` | The review queue                                                         |
| `frontend/src/lib/api/product-images/`                           | Fetchers, hooks, thumbnail batcher                                       |

## 9. Automatic vs manual

| Task                                                 | Automatic? | Where                                                                                 |
| ---------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| Weekly catalogue import and Open Food Facts seed     | ✅ auto    | backend job                                                                           |
| Copying main photos into the bucket                  | ✅ auto    | backend job, a few thousand an hour                                                   |
| **Creating the public bucket, its domain and token** | ❌ manual  | Cloudflare dashboard once (see [DEPLOYMENT.md](DEPLOYMENT.md#product-photo-env-vars)) |
| **Setting the four `R2_PUBLIC_*` variables**         | ❌ manual  | Dokploy, per environment                                                              |
| **Choosing the best photo for popular products**     | ❌ manual  | the dashboard queue                                                                   |

## 10. Gotchas

- **Do not fetch Open Food Facts on page views.** Their limit is per IP and the whole server shares one.
- **The export is about 1.5 GB.** It is streamed and never written to disk; only lines whose barcode we carry are split.
- **Barcodes are matched without leading zeros.** Sources disagree about padding.
- **Product photos are JPEG only.** The JDK cannot write WebP without a native library; the browser always sends JPEG.
- **`R2_PUBLIC_URL` must be `https://`.** The Content Security Policy in `frontend/src/utils/content-security-policy.ts` allows images only from `https:`, so a local `http://` S3 stand-in shows broken images unless you widen `img-src` while testing.
- **The crop height limit sits on `ReactCrop`, not the `<img>`.** `ReactCrop.css` makes the image inherit `max-height`, so a class on the image is ignored and a tall photo pushes the buttons off screen.
- **A fresh database gets a CHECK on the status and source values.** Since Hibernate 7 the converter no longer keeps it out, so a database created from scratch has `product_image_status_check` and `product_image_source_check`. Production's table is older and has neither. `ddl-auto=update` never refreshes a CHECK, so until the move to Flyway, adding an `ImageStatus` or `ImageSource` value means updating that constraint by hand in every database that has it.

## 11. Future work

- Contribute user photos back to Open Food Facts (their API accepts end-user photos), which would grow coverage of Croatian products.
- `og:image` and the Product JSON-LD `image` for product SEO (#230, product page SEO).
- Thumbnails on shopping list rows, which do not use `ProductCard`.
- Moving avatars from Postgres base64 to the public bucket (decided, separate PR).
