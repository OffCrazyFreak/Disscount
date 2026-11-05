import { ImageResponse } from "next/og";
import { PRODUCT_CARD_CONTENT_TYPE } from "@/app/og/product-share-image";
import {
  BRAND,
  Cart,
  loadFonts,
  OG_BACKGROUND,
  size,
  Sparkle,
} from "@/app/og/render-og";

const PHOTO_TIMEOUT_MS = 3_000;
const TILE_SIDE = 490;
const YEAR_IN_SECONDS = 31_536_000;
// 4:4:4 because the default 4:2:0 visibly washes out the saturated green wordmark. No mozjpeg:
// it forces progressive encoding, and baseline is the safe bet for link preview crawlers.
const JPEG_OPTIONS = { quality: 85, chromaSubsampling: "4:4:4" } as const;

type Sharp = (typeof import("sharp"))["default"];

// Fetched here, not by Satori, so a slow or failing bucket hits our timeout and our error path.
// Re-encoded as JPEG because photos are stored as WebP, which Satori's docs never list as supported.
async function photoDataUri(photoUrl: string, sharp: Sharp): Promise<string> {
  const response = await fetch(photoUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Product photo answered ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const jpeg = await sharp(bytes).jpeg(JPEG_OPTIONS).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

/** The photo sits in the middle because chat apps may crop a card to its centre square. */
export default async function renderProductOg(photoUrl: string) {
  // Loaded here, not at the top: a missing native binary then rejects this call, which the
  // route turns into the brand image, instead of failing the route module for every request.
  // First, so that case fails before the photo fetch and the render are spent.
  const { default: sharp } = await import("sharp");

  const [photo, fonts] = await Promise.all([
    photoDataUri(photoUrl, sharp),
    loadFonts(),
  ]);

  const card = new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: OG_BACKGROUND,
      }}
    >
      <Sparkle left={1060} top={96} size={44} opacity={0.8} />
      <Sparkle left={960} top={300} size={30} opacity={0.6} />
      <Sparkle left={1040} top={480} size={52} opacity={0.85} />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: (size.width - TILE_SIDE) / 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Cart width={120} height={89} />
        <span
          style={{
            fontFamily: "Saira Stencil",
            fontWeight: 600,
            fontSize: 62,
            color: BRAND,
            lineHeight: 1,
          }}
        >
          disscount
        </span>
      </div>

      <div
        style={{
          display: "flex",
          padding: 15,
          borderRadius: 32,
          background: "#ffffff",
          boxShadow: "0 14px 32px rgba(46,197,13,0.25)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori only reads <img> */}
        <img
          src={photo}
          alt=""
          width={TILE_SIDE - 30}
          height={TILE_SIDE - 30}
          // The full file keeps the photo's shape, and Satori stretches an img to its box by default.
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>,
    { ...size, fonts },
  );

  // ImageResponse renders lazily inside its stream, so without this a failed render would
  // be a 200 that Cloudflare caches for a year, and the caller's fallback would never run.
  const png = Buffer.from(await card.arrayBuffer());

  // next/og only writes PNG, which reached 563 KB against WhatsApp's 600 KB preview limit.
  const jpeg = await sharp(png).jpeg(JPEG_OPTIONS).toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": PRODUCT_CARD_CONTENT_TYPE,
      "Cache-Control": `public, max-age=${YEAR_IN_SECONDS}, immutable`,
    },
  });
}
