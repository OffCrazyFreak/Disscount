import {
  getStoredBottomNavVariant,
  setStoredBottomNavVariant,
} from "@/utils/browser/local-storage";

export const BOTTOM_NAV_VARIANTS = ["pill", "flat", "glass"] as const;

export type TBottomNavVariant = (typeof BOTTOM_NAV_VARIANTS)[number];

export const DEFAULT_BOTTOM_NAV_VARIANT: TBottomNavVariant = "pill";

/** Lets a variant be compared on a real phone against the deployed site */
const URL_PARAM = "nav";

function parseVariant(value: string | null | undefined) {
  return BOTTOM_NAV_VARIANTS.find((variant) => variant === value);
}

/**
 * Read from `window.location` rather than `useSearchParams`, which would opt the
 * root layout's subtree out of prerendering. The cost is that the bar renders
 * the default for one frame before switching, which is acceptable for what is a
 * comparison affordance rather than a user-facing setting.
 */
export function readBottomNavVariant(): TBottomNavVariant {
  if (typeof window === "undefined") return DEFAULT_BOTTOM_NAV_VARIANT;

  const fromUrl = parseVariant(
    new URLSearchParams(window.location.search).get(URL_PARAM),
  );

  return (
    fromUrl ??
    parseVariant(getStoredBottomNavVariant()) ??
    DEFAULT_BOTTOM_NAV_VARIANT
  );
}

export function writeBottomNavVariant(variant: TBottomNavVariant) {
  setStoredBottomNavVariant(variant);
}

export function nextBottomNavVariant(
  variant: TBottomNavVariant,
): TBottomNavVariant {
  const index = BOTTOM_NAV_VARIANTS.indexOf(variant);

  return BOTTOM_NAV_VARIANTS[(index + 1) % BOTTOM_NAV_VARIANTS.length];
}
