import localFont from "next/font/local";

// A 28 KB subset: the full Google TTF is a 4.5 MB CJK font, and next/font/google has no fallback metrics for Huninn.
export const huninn = localFont({
  src: "./Huninn/huninn-latin-ext.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-huninn",
  display: "swap",
  // Descenders reach 23% against a declared 18%, and Chromium clips them at 125% scaling.
  declarations: [{ prop: "descent-override", value: "26%" }],
});

// Huninn draws U+2026 centred and CJK wide; this one-glyph face keeps an ellipsis on the baseline.
export const baselineEllipsis = localFont({
  src: "./Ellipsis/baseline-ellipsis.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-baseline-ellipsis",
  display: "swap",
  // The fallback face has no unicode-range, so it would take over every character from Huninn.
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+2026" }],
});

export const sairaStencil = localFont({
  src: "./Saira_Stencil/static/SairaStencil-SemiBold.ttf",
  weight: "600",
  style: "normal",
  variable: "--font-saira-stencil",
  display: "swap",
});
