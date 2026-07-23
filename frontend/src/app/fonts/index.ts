import localFont from "next/font/local";

// A 28 KB subset: the full Google TTF is a 4.5 MB CJK font, and next/font/google
// has no fallback metrics for Huninn.
export const huninn = localFont({
  src: "./Huninn/huninn-latin-ext.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-huninn",
  display: "swap",
});

export const sairaStencil = localFont({
  src: "./Saira_Stencil/static/SairaStencil-SemiBold.ttf",
  weight: "600",
  style: "normal",
  variable: "--font-saira-stencil",
  display: "swap",
});
