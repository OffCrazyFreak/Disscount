# Brand assets

All brand imagery lives under `frontend/public/brand/` and is generated from a
single source of truth (the happy-cart doodle + the Saira Stencil wordmark), so
every asset stays pixel-consistent.

- **Brand green:** `#2ec50d` (the app's `--primary`, `oklch(0.7183 0.2344 141.297)`).
- **Wordmark font:** Saira Stencil SemiBold. **Tagline font:** Huninn.
- **Tagline:** "Pronađi najbolje cijene u Hrvatskoj" · "Usporedi cijene u 29 trgovina · Besplatno".

## Logo (`brand/logo/`)

Four marks, each in its own subfolder (`brand/logo/<mark>/`), in two colour
variants (`-rgb` brand green, `-white`) and five formats (**SVG, PNG, WebP,
animated GIF, animated WebP**), named `<mark>-<variant>.<format>`:

| Mark | Subfolder | Base names | Use |
| --- | --- | --- | --- |
| Cart only | `cart/` | `cart-rgb`, `cart-white` | Icon / favicon / avatar contexts |
| Wordmark | `wordmark/` | `wordmark-rgb`, `wordmark-white` | Text-only lockups |
| Horizontal lockup | `lockup-horizontal/` | `lockup-horizontal-rgb`, `lockup-horizontal-white` | Headers, footers, email signatures, most uses |
| Vertical lockup | `lockup-vertical/` | `lockup-vertical-rgb`, `lockup-vertical-white` | Splash / hero / when a taller mark is needed |

e.g. `logo/lockup-horizontal/lockup-horizontal-rgb.svg`,
`logo/lockup-horizontal/lockup-horizontal-white-animated.gif`. Use `-rgb` on
light backgrounds, `-white` on dark or photo backgrounds.

Notes:

- Static SVGs are vector cart + embedded wordmark image (self-contained, render anywhere). PNG/WebP are transparent.
- `-rgb` GIFs have a white matte; `-white` GIFs are transparent; WebP is always transparent. Both loop the draw-on animation.
- The cart also ships `cart-<variant>-animated.svg` (the CSS-animated source). `cart/cart-rgb.svg` is the always-visible static mark and the geometry source for the icons and JSON-LD.
- Clear space: keep a margin equal to the cart height around any lockup; never recolour or restretch.

## Social (`brand/social/`)

Sized and safe-area-checked per current platform specs. Upload these in each platform's settings:

| File | Platform | Size | Where to upload |
| --- | --- | --- | --- |
| `avatar.png` | Any profile photo (FB, IG, LinkedIn, YouTube, Reddit, X, **Gmail/Google**, **WhatsApp**) | 1000×1000 | Profile picture (circle-cropped) |
| `og-image.png` | Link previews (FB, LinkedIn, X, Discord, **WhatsApp**, **Gmail**) | 1200×630 | Served automatically as the site OG image; also usable manually |
| `github-social.png` | GitHub repo | 1280×640 | Repo → Settings → Social preview |
| `kofi-cover.png` | Ko-fi | 1920×640 (3:1) | Ko-fi page → Edit cover |
| `youtube-banner.png` | YouTube channel | 2560×1440 (safe 1546×423) | Channel → Customize → Branding → Banner |
| `youtube-thumbnail.png` | YouTube video | 1280×720 | Per-video thumbnail |
| `linkedin-banner.png` | LinkedIn profile | 1584×396 | Profile → Edit background |
| `facebook-cover.png` | Facebook page | 1640×624 | Page → Edit cover |
| `reddit-banner.png` | Reddit | 1920×384 | Community/profile → Banner |
| `post-square.png` | Feed post (IG, FB, LinkedIn) | 1080×1080 | New post |
| `story.png` | Story / status (IG, FB, **WhatsApp status**) | 1080×1920 (9:16) | New story/status |

**Gmail / WhatsApp** need no bespoke files: profile photo = `avatar.png`, WhatsApp status = `story.png`, link previews (chat/email) = `og-image.png`, email signature = `logo/lockup-horizontal/lockup-horizontal-rgb`.

## Favicon, PWA icons, splash (auto-wired)

These are referenced by the app and need no manual upload:

- `brand/icons/icon.svg` + `src/app/favicon.ico` (favicon; `icon.svg` also in `layout.tsx` metadata).
- `brand/icons/` (PWA `icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon-180`, and `icon.svg`) referenced by `manifest.ts` + `layout.tsx`.
- `public/splash/` (iOS launch screens, cart + wordmark on white) referenced by `<AppleSplashScreens>`. Android/Chrome has no custom-image splash: it composes one from the manifest's `background_color` (white) + the 512 icon + app `name`, so it shows the cart + "Disscount" text on white.

## Regenerating

Run from `frontend/` (all read the same sources, so recolouring or reshaping the
cart/wordmark propagates everywhere):

```bash
node scripts/generate-logos.mjs       # 4 marks × 2 variants × 5 formats
node scripts/generate-pwa-icons.mjs   # PWA icons + favicon.ico
node scripts/generate-ios-splash.mjs  # iOS splash screens
```

Sources: `brand/logo/cart/cart-rgb.svg` (geometry),
`brand/logo/cart/cart-rgb-animated.svg` (animation paths),
`brand/logo/wordmark/wordmark-rgb.png` (wordmark). The brand green is
the `GREEN` constant in `scripts/lib/cart-frames.mjs` (and `generate-logos.mjs`).
Social banners are built from a Playwright artboard (not committed) since they
use live-rendered fonts.
