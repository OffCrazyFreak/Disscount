import type { MetadataRoute } from "next";
import { userNavItems } from "@/constants/navigation";

// Web App Manifest (served at /manifest.webmanifest). Next.js injects the
// <link rel="manifest"> automatically when this file exists.
export default function manifest(): MetadataRoute.Manifest {
  // App shortcuts (long-press the installed icon) mirror the live user nav
  // items, skipping ones that aren't released yet so the list stays accurate.
  const shortcuts = userNavItems
    .filter((item) => !item.comingSoon)
    .map((item) => ({
      name: item.label,
      short_name: item.shortLabel ?? item.label,
      url: item.href,
    }));

  return {
    name: "Disscount - Pronađi najbolje cijene u Hrvatskoj",
    short_name: "Disscount",
    description:
      "Usporedi cijene proizvoda u hrvatskim trgovinama, izradi popise za kupnju i prati popuste.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "hr",
    dir: "ltr",
    background_color: "#fafafa",
    theme_color: "#2ec50d",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts,
  };
}
