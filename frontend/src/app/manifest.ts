import type { MetadataRoute } from "next";
import { userNavItems } from "@/constants/navigation";

// `launch_handler` isn't in Next's manifest type yet, so extend it here.
type WebAppManifest = MetadataRoute.Manifest & {
  launch_handler?: { client_mode?: string | string[] };
};

// Web App Manifest (served at /manifest.webmanifest). Next.js injects the
// <link rel="manifest"> automatically when this file exists.
export default function manifest(): WebAppManifest {
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
    theme_color: "#ffffff",
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
    // Shown in the browser's richer (app-store-like) install dialog.
    screenshots: [
      {
        src: "/screenshots/screenshot-narrow.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/screenshots/screenshot-wide.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
      },
    ],
    shortcuts,
    // Reuse an already-open window instead of spawning a new one when launched
    // from a shortcut or notification.
    launch_handler: { client_mode: "focus-existing" },
  };
}
