import type { MetadataRoute } from "next";
import { userNavItems } from "@/constants/navigation";

// Neither key is in Next's manifest type yet.
type WebAppManifest = MetadataRoute.Manifest & {
  launch_handler?: { client_mode?: string | string[] };
  share_target?: {
    action: string;
    method?: "GET" | "POST";
    params: { title?: string; text?: string; url?: string };
  };
};

// Next injects <link rel="manifest"> automatically when this file exists.
export default function manifest(): WebAppManifest {
  // Long-press shortcuts mirror the nav, minus anything not yet released.
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
    // White to match the iOS launch screens, which Chrome composes against.
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/brand/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Shown in the browser's richer (app-store-like) install dialog.
    screenshots: [
      {
        src: "/screenshots/screenshot-narrow.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Usporedba cijena na mobitelu",
      },
      {
        src: "/screenshots/screenshot-wide.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "Usporedba cijena na računalu",
      },
    ],
    shortcuts,
    // Shares from other apps land in /share-target and become a product search.
    share_target: {
      action: "/share-target",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
    // Reuse an open window rather than spawning one per shortcut launch.
    launch_handler: { client_mode: "focus-existing" },
  };
}
