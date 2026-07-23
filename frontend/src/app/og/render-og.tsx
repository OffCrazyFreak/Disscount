import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CART_VIEW_BOX } from "@/components/icons/cart-logo";

// Shared by opengraph-image.tsx and twitter-image.tsx.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Disscount - usporedba cijena proizvoda u 25+ trgovačkih lanaca u Hrvatskoj.";

const BRAND = "#2ec50d";
const INK = "#252525";

// Satori can't read woff2, so these are .ttf and .woff builds of the app fonts.
// Reading them from src/ is safe because both OG routes are statically generated.
async function loadFonts() {
  const dir = join(process.cwd(), "src", "app", "fonts");

  const [saira, huninn] = await Promise.all([
    readFile(join(dir, "Saira_Stencil", "static", "SairaStencil-SemiBold.ttf")),
    readFile(join(dir, "Huninn", "huninn-latin-ext.woff")),
  ]);

  return [
    { name: "Saira Stencil", data: saira, weight: 600 as const },
    { name: "Huninn", data: huninn, weight: 400 as const },
  ];
}

interface ISparkleProps {
  left: number;
  top: number;
  size: number;
  opacity: number;
}

function Sparkle(props: ISparkleProps) {
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill={BRAND}
      style={{
        position: "absolute",
        left: props.left,
        top: props.top,
        opacity: props.opacity,
      }}
    >
      <path d="M12 0c1 8 3 11 12 12-9 1-11 4-12 12-1-8-3-11-12-12 9-1 11-4 12-12Z" />
    </svg>
  );
}

function Cart() {
  return (
    <svg
      width={214}
      height={159}
      viewBox={CART_VIEW_BOX}
      fill="none"
      stroke={BRAND}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(2.5 0) rotate(-7 23 53.5)">
        <path d="M4.5 8.5c2.4-.3 4.8-.4 7.2-.2l1 .1 5.8 27.4c.2 1.2 1.3 2 2.5 2h27.3c1.1 0 2.1-.7 2.4-1.8l6.6-20.6c.4-1.3-.6-2.7-2-2.7l-36.5-.85" />
        <path d="M24.5 22.3c2.5-3.1 5.2-3.2 8-.3M38.5 22.1c2.2-2.8 4.7-2.9 7.2-.4" />
        <circle cx="23" cy="49" r="4.5" />
        <circle cx="45" cy="49" r="4.5" />
      </g>
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function OgImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background:
          "linear-gradient(135deg, #e9fae4 0%, #ffffff 55%, #f1fbec 100%)",
        fontFamily: "Huninn",
      }}
    >
      <Sparkle left={120} top={96} size={54} opacity={0.9} />
      <Sparkle left={1012} top={128} size={40} opacity={0.72} />
      <Sparkle left={150} top={470} size={34} opacity={0.68} />
      <Sparkle left={1038} top={484} size={52} opacity={0.85} />

      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <Cart />
        <span
          style={{
            fontFamily: "Saira Stencil",
            fontWeight: 600,
            fontSize: 138,
            color: BRAND,
            lineHeight: 1,
          }}
        >
          disscount
        </span>
      </div>

      <div style={{ display: "flex", marginTop: 26, fontSize: 42, color: INK }}>
        Pronađi najbolje cijene u Hrvatskoj
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginTop: 44,
          padding: "20px 40px",
          borderRadius: 999,
          background: BRAND,
          color: "#ffffff",
          fontSize: 36,
          boxShadow: "0 14px 32px rgba(46,197,13,0.35)",
        }}
      >
        <span style={{ display: "flex" }}>Uštedi već danas</span>
        <ArrowRight />
      </div>
    </div>
  );
}

export default async function renderBrandOg() {
  return new ImageResponse(<OgImage />, { ...size, fonts: await loadFonts() });
}
