import type { InstallPlatform } from "@/components/custom/pwa/use-install-prompt";

/**
 * A desktop has no home screen, so the phone wording reads as a mistake there.
 * Shared because the banner and the card have to agree with each other and with
 * the instructions sheet they open.
 */
export function isDesktopPlatform(platform: InstallPlatform): boolean {
  return platform === "desktop" || platform === "macSafari";
}

export function installActionLabel(platform: InstallPlatform): string {
  return isDesktopPlatform(platform)
    ? "Instaliraj aplikaciju"
    : "Dodaj na početni zaslon";
}

export function installPitch(platform: InstallPlatform): string {
  return isDesktopPlatform(platform)
    ? "Instaliraj Disscount za brži pristup."
    : "Dodaj Disscount na početni zaslon za brži pristup.";
}
