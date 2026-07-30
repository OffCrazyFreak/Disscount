import type { MetadataRoute } from "next";
import { userNavItems } from "@/constants/navigation";

type Shortcut = NonNullable<MetadataRoute.Manifest["shortcuts"]>[number];

// Chrome takes PNG only here. The tiles come from
// scripts/generate-shortcut-icons.mjs; why each shortcut needs two of them is in
// docs/PWA.md#app-shortcuts.
function shortcutIcons(id: string): NonNullable<Shortcut["icons"]> {
  return [
    {
      src: `/brand/shortcuts/${id}.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: `/brand/shortcuts/${id}-any.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
  ];
}

const scanShortcut: Shortcut = {
  name: "Skeniraj barkod",
  short_name: "Skeniraj",
  description: "Skeniraj barkod proizvoda i usporedi cijene",
  url: "/?scan=1",
  icons: shortcutIcons("scan"),
};

// Android shows 3 of these (Chrome keeps a fourth slot for its own "Site
// settings"), so order is what decides what a phone actually surfaces. Stated
// explicitly rather than inherited from navigation.ts, where the ordering is about
// the sidebar and a reshuffle there would silently drop a shortcut from phones.
// Scanning leads (fastest path from launcher to a price), then the two the till
// needs. Praćenje is fourth: it is a browsing destination, not a two-tap errand.
const PWA_SHORTCUT_ORDER = [
  "scan",
  "digital-cards",
  "shopping-lists",
  "watchlist",
];

function shortcutRank(id: string): number {
  const index = PWA_SHORTCUT_ORDER.indexOf(id);

  return index === -1 ? PWA_SHORTCUT_ORDER.length : index;
}

export const pwaShortcuts: Shortcut[] = [
  scanShortcut,
  ...userNavItems
    .filter((item) => !item.comingSoon && item.shortcutDescription)
    .map((item) => ({
      name: item.label,
      short_name: item.shortLabel ?? item.label,
      description: item.shortcutDescription,
      url: item.href,
      icons: shortcutIcons(item.id),
      id: item.id,
    }))
    .sort((a, b) => shortcutRank(a.id) - shortcutRank(b.id))
    .map(({ id: _id, ...shortcut }) => shortcut),
];
