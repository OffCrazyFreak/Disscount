"use client";

import { useSyncExternalStore } from "react";

interface IBeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// iOS Safari exposes a non-standard `navigator.standalone` flag.
interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

// Where the beforeInteractive script in the root layout stashes the event it catches before hydration.
declare global {
  interface Window {
    __installPrompt?: IBeforeInstallPromptEvent;
  }
}

// Beyond standalone, because the spec falls back to minimal-ui where unsupported, and a desktop install can report window-controls-overlay.
const INSTALLED_DISPLAY_MODES = [
  "standalone",
  "minimal-ui",
  "fullscreen",
  "window-controls-overlay",
];

function detectStandalone(): boolean {
  return (
    // Trusted Web Activities identify their Android app launch through the referrer.
    document.referrer.startsWith("android-app://") ||
    INSTALLED_DISPLAY_MODES.some(
      (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
    ) ||
    (window.navigator as IOSNavigator).standalone === true
  );
}

// Embedded browsers have no home screen or browser menu to reach, so advertising an install is a dead end on every platform.
function detectInAppBrowser(): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Line|Twitter|TikTok|Snapchat/i.test(
    window.navigator.userAgent,
  );
}

function detectIOS(): boolean {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIPhoneLike = /iphone|ipad|ipod/.test(ua);
  // iPadOS reports as desktop Safari, so detect it via touch points.
  const isIPadOS =
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1;

  return isIPhoneLike || isIPadOS;
}

// Since iOS 16.4 any eligible browser can add to the home screen; webviews still cannot.
function detectIOSInstallCapable(): boolean {
  return detectIOS() && !detectInAppBrowser();
}

// Desktop Safari installs through the menu bar, a different instruction; iPadOS reports the same UA, so detectIOS rules it out first.
function detectMacSafari(): boolean {
  const ua = window.navigator.userAgent;

  return (
    !detectIOS() &&
    /Macintosh/.test(ua) &&
    /Safari/.test(ua) &&
    !/Chrome|Chromium|Edg|OPR/.test(ua)
  );
}

/** Four because a share sheet, a menu bar, a phone menu and an address-bar icon are different things to press, and naming the wrong one misleads. */
export type InstallPlatform = "ios" | "macSafari" | "android" | "desktop";

function detectPlatform(): InstallPlatform {
  if (detectIOS()) return "ios";
  if (detectMacSafari()) return "macSafari";
  if (/Android/i.test(window.navigator.userAgent)) return "android";

  return "desktop";
}

// Firefox on the desktop has no install route at all; Firefox on Android installs fine, hence the split.
function detectNoInstallRoute(): boolean {
  const ua = window.navigator.userAgent;
  const isFirefoxDesktop =
    /Firefox\//.test(ua) && !/Android|Mobile|Tablet/.test(ua);

  // A webview has no home screen to add to and no menu to reach.
  return isFirefoxDesktop || detectInAppBrowser();
}

// Module scope so both banners share one prompt; ready stays false until client detection, so first paint never flashes install UI.
interface IInstallState {
  deferredPrompt: IBeforeInstallPromptEvent | null;
  isStandalone: boolean;
  isIOSInstallCapable: boolean;
  platform: InstallPlatform;
  hasInstallRoute: boolean;
  ready: boolean;
}

const SERVER_STATE: IInstallState = {
  deferredPrompt: null,
  isStandalone: false,
  isIOSInstallCapable: false,
  platform: "desktop",
  // Assumed until detection runs, so nothing flashes an unsupported notice.
  hasInstallRoute: true,
  ready: false,
};

let state: IInstallState = SERVER_STATE;
const listeners = new Set<() => void>();
let initialized = false;

function setState(patch: Partial<IInstallState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

// The stash outlives the module under Fast Refresh, so leaving it lets init() re-adopt a spent event, and a second prompt() only throws.
function clearPrompt() {
  delete window.__installPrompt;
  setState({ deferredPrompt: null });
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Still needed for events after hydration; the early script only catches the ones before it.
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__installPrompt = event as IBeforeInstallPromptEvent;
    setState({ deferredPrompt: event as IBeforeInstallPromptEvent });
  });

  window.addEventListener("appinstalled", () => {
    clearPrompt();
    setState({ isStandalone: true });
  });

  setState({
    deferredPrompt: window.__installPrompt ?? null,
    isStandalone: detectStandalone(),
    isIOSInstallCapable: detectIOSInstallCapable(),
    platform: detectPlatform(),
    hasInstallRoute: !detectNoInstallRoute(),
    ready: true,
  });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  init();

  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return SERVER_STATE;
}

let prompting = false;

async function promptInstall() {
  const { deferredPrompt } = state;
  if (!deferredPrompt || prompting) return;

  // A flag rather than clearing, because clearing first would flip the mounted surfaces to manual instructions mid-prompt.
  prompting = true;

  try {
    await deferredPrompt.prompt();

    // prompt() works once per event, so a dismissal spends it too; clearing here sends the next click to the manual instructions with no dead click.
    await deferredPrompt.userChoice;
  } catch {
    // An already-spent or invalid event rejects; same outcome either way.
  } finally {
    clearPrompt();
    prompting = false;
  }
}

export function useInstallPrompt() {
  const {
    deferredPrompt,
    isStandalone,
    isIOSInstallCapable,
    platform,
    hasInstallRoute,
    ready,
  } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const canInstall = deferredPrompt !== null;
  const notInstalled = ready && !isStandalone;

  // Promotional surfaces ignore the prompt event, because beforeinstallprompt is Chromium-only and macOS Safari and Firefox on Android still install.
  const canShowInstallUI = notInstalled && (canInstall || isIOSInstallCapable);
  const canPromoteInstall = notInstalled && hasInstallRoute;
  const showUnsupportedNotice = notInstalled && !hasInstallRoute;

  return {
    ready,
    canInstall,
    canShowInstallUI,
    canPromoteInstall,
    showUnsupportedNotice,
    platform,
    promptInstall,
  };
}
