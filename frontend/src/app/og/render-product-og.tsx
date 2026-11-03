import { ImageResponse } from "next/og";
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

// Fetched here, not by Satori, so a slow or failing bucket hits our timeout and our error path.
async function photoDataUri(photoUrl: string): Promise<string> {
  const response = await fetch(photoUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Product photo answered ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

/** The photo sits in the middle because chat apps may crop a card to its centre square. */
export default async function renderProductOg(photoUrl: string) {
  const [photo, fonts] = await Promise.all([
    photoDataUri(photoUrl),
    loadFonts(),
  ]);

  return new ImageResponse(
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
        />
      </div>
    </div>,
    {
      ...size,
      fonts,
      headers: {
        "Cache-Control": `public, max-age=${YEAR_IN_SECONDS}, immutable`,
      },
    },
  );
}
