import localFont from "next/font/local";

// A 28 KB subset: the full Google TTF is a 4.5 MB CJK font, and next/font/google
// has no fallback metrics for Huninn.
export const huninn = localFont({
  src: "./Huninn/huninn-latin-ext.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-huninn",
  display: "swap",
  // The file declares an 18% descent but descenders reach 23%, and Chromium
  // clips input text there at 125% scaling; 26% leaves room for pixel rounding.
  declarations: [{ prop: "descent-override", value: "26%" }],
});

// Huninn draws U+2026 vertically centred and CJK wide; this one-glyph face is three
// Huninn periods, so a CSS overflow ellipsis sits on the baseline.
export const baselineEllipsis = localFont({
  src: "./Ellipsis/baseline-ellipsis.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-baseline-ellipsis",
  display: "swap",
  // The generated fallback face has no unicode-range, so it would sit ahead of
  // Huninn in the stack and take over every character.
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
