import type { InstallPlatform } from "@/components/custom/pwa/use-install-prompt";

/** A desktop has no home screen, so the phone wording reads as a mistake; shared so the banner, card and sheet agree. */
export function isDesktopPlatform(platform: InstallPlatform): boolean {
  return platform === "desktop" || platform === "macSafari";
}

// These return message keys in the "common" namespace; the caller translates.
export function installActionLabelKey(platform: InstallPlatform) {
  return isDesktopPlatform(platform)
    ? "install.actionDesktop"
    : "install.actionMobile";
}

export function installPitchKey(platform: InstallPlatform) {
  return isDesktopPlatform(platform)
    ? "install.pitchDesktop"
    : "install.pitchMobile";
}
