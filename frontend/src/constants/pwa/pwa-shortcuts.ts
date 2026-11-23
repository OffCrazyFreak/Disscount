import type { MetadataRoute } from "next";
import shell from "@/i18n/messages/hr/shell.json";
import {
  findNavItem,
  type NavItemId,
  type NavKey,
} from "@/constants/navigation";

type Shortcut = NonNullable<MetadataRoute.Manifest["shortcuts"]>[number];

// Chrome takes PNG only; docs/PWA.md#app-shortcuts says why each shortcut needs two tiles.
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

// The manifest is static with lang "hr", so shortcuts read the Croatian messages directly instead of a request locale.
function hr(key: NavKey): string {
  return shell.nav[key.slice("nav.".length) as keyof typeof shell.nav];
}

const scanShortcut: Shortcut = {
  name: "Skeniraj barkod",
  short_name: "Skeniraj",
  description: "Skeniraj barkod proizvoda i usporedi cijene",
  url: "/?scan=1",
  icons: shortcutIcons("scan"),
};

// Owner's order from #127: Android shows only the first 3, and loyalty cards are needed fast at the till.
export const shortcutNavIds = [
  "shopping-lists",
  "digital-cards",
  "watchlist",
  "map",
  "spending",
] as const satisfies readonly NavItemId[];

export const pwaShortcuts: Shortcut[] = [
  scanShortcut,
  ...shortcutNavIds
    .map(findNavItem)
    .filter((item) => !item.comingSoon && item.shortcutDescriptionKey)
    .map((item) => ({
      name: hr(item.labelKey),
      short_name: hr(item.shortLabelKey ?? item.labelKey),
      description: item.shortcutDescriptionKey
        ? hr(item.shortcutDescriptionKey)
        : undefined,
      url: item.href,
      icons: shortcutIcons(item.id),
    })),
];
