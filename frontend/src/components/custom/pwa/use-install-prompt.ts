"use client";

import { useSyncExternalStore } from "react";

// Captured so installation can be triggered from our own button.
interface IBeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// iOS Safari exposes a non-standard `navigator.standalone` flag.
interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

// Where the beforeInteractive script in the root layout stashes the event it
// catches before hydration.
declare global {
  interface Window {
    __installPrompt?: IBeforeInstallPromptEvent;
  }
}

// Every display mode that means "already installed". Checking only standalone
// missed two: the spec falls standalone back to minimal-ui where it is not
// supported, and a desktop install can report window-controls-overlay.
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

// Embedded browsers render pages inside a host app, so there is no home screen
// to add to and no browser menu to reach. Advertising an install there is a
// dead end on every platform, not just iOS.
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

// Desktop Safari installs through the menu bar (File > Add to Dock, Sonoma and
// later), which is a different instruction from the browser menu everyone else
// uses. iPadOS reports the same UA, so detectIOS has to rule it out first.
function detectMacSafari(): boolean {
  const ua = window.navigator.userAgent;

  return (
    !detectIOS() &&
    /Macintosh/.test(ua) &&
    /Safari/.test(ua) &&
    !/Chrome|Chromium|Edg|OPR/.test(ua)
  );
}

/**
 * Which set of manual steps to show. Four, because the wording genuinely differs:
 * a share sheet, a menu bar, a phone menu, and an address-bar icon are four
 * different things to press, and naming the wrong one is worse than saying nothing.
 */
export type InstallPlatform = "ios" | "macSafari" | "android" | "desktop";

function detectPlatform(): InstallPlatform {
  if (detectIOS()) return "ios";
  if (detectMacSafari()) return "macSafari";
  if (/Android/i.test(window.navigator.userAgent)) return "android";

  return "desktop";
}

// Firefox on the desktop is the one mainstream browser with no install route at
// all: no beforeinstallprompt, and no menu entry either, so its taskbar-tabs
// work is still experimental. Firefox on Android installs fine, hence the split.
function detectNoInstallRoute(): boolean {
  const ua = window.navigator.userAgent;
  const isFirefoxDesktop =
    /Firefox\//.test(ua) && !/Android|Mobile|Tablet/.test(ua);

  // A webview has no home screen to add to and no menu to reach.
  return isFirefoxDesktop || detectInAppBrowser();
}

// Module scope, so both banners share one prompt and consuming it clears both.
// ready stays false until client detection runs, so SSR and first paint never flash install UI.
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

// Drop the event from both places it lives. The stash outlives the module under
// Fast Refresh, so leaving it behind lets the next init() re-adopt a spent
// event, and a second prompt() on one of those only ever throws.
function clearPrompt() {
  delete window.__installPrompt;
  setState({ deferredPrompt: null });
}

// Attach the window listeners exactly once, on the first subscription.
function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Still needed for events that arrive after hydration: the early script is
  // only the safety net for the ones that arrive before it.
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

  // Deduped with a flag rather than by clearing, so the surfaces stay honest
  // while the native sheet is open: three of them can be mounted at once, and
  // clearing first would flip them to the manual instructions mid-prompt.
  prompting = true;

  try {
    await deferredPrompt.prompt();

    // prompt() may only be called once per event, so a dismissal spends it just
    // as an accept does. Clearing here rather than up front means the surfaces
    // fall through to the manual instructions on the very next click, with no
    // dead click on a spent event in between.
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

  // Three tiers, all of which rule out an install that has already happened.
  //
  // Unprompted surfaces (the floating banner, the sidebar) wait for evidence
  // that an install is one tap away: a captured prompt event, or iOS's share
  // sheet.
  //
  // Promotional surfaces (the landing page) show wherever an install is possible
  // at all, which is wider than a captured prompt: beforeinstallprompt is
  // Chromium-only, so gating on it writes off macOS Safari, which installs
  // through File > Add to Dock, and Firefox on Android, which installs through
  // its own menu. Both would be told to go and fetch Chrome for no reason.
  //
  // The unsupported notice is the narrow remainder: somewhere a person genuinely
  // cannot install however hard they look, so pointing them at another browser
  // is the only useful thing left to say.
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
