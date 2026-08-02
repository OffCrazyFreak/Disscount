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
  isIOS: boolean;
  isIOSInstallCapable: boolean;
  isMacSafari: boolean;
  hasInstallRoute: boolean;
  ready: boolean;
}

const SERVER_STATE: IInstallState = {
  deferredPrompt: null,
  isStandalone: false,
  isIOS: false,
  isIOSInstallCapable: false,
  isMacSafari: false,
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

// Attach the window listeners exactly once, on the first subscription.
function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setState({ deferredPrompt: event as IBeforeInstallPromptEvent });
  });

  window.addEventListener("appinstalled", () => {
    setState({ deferredPrompt: null, isStandalone: true });
  });

  setState({
    isStandalone: detectStandalone(),
    isIOS: detectIOS(),
    isIOSInstallCapable: detectIOSInstallCapable(),
    isMacSafari: detectMacSafari(),
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

async function promptInstall() {
  const { deferredPrompt } = state;
  if (!deferredPrompt) return;

  // One-shot: clear before awaiting so a second banner can't reuse the event.
  setState({ deferredPrompt: null });

  await deferredPrompt.prompt();
  await deferredPrompt.userChoice;
}

export function useInstallPrompt() {
  const {
    deferredPrompt,
    isStandalone,
    isIOS,
    isIOSInstallCapable,
    isMacSafari,
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
    isIOS,
    isMacSafari,
    promptInstall,
  };
}
