import type { MetadataRoute } from "next";
import shell from "@/i18n/messages/hr/shell.json";
import { userNavItems, type NavKey } from "@/constants/navigation";

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

// The manifest is static and declares lang "hr", so shortcuts read the Croatian
// messages directly instead of going through a request locale.
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

// Android shows 3 of these (Chrome keeps a fourth slot for its own "Site
// settings"), so order is what decides what a phone actually surfaces.
// Scanning leads: it is the fastest path from launcher to a price.
export const pwaShortcuts: Shortcut[] = [
  scanShortcut,
  ...userNavItems
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
