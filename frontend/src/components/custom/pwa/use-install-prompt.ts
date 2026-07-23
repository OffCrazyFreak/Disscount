"use client";

import { useSyncExternalStore } from "react";

// Chrome/Edge fire `beforeinstallprompt` before showing their own install UI.
// We capture the event so we can trigger installation from our own button.
interface IBeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// iOS Safari exposes a non-standard `navigator.standalone` flag.
interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

function detectStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as IOSNavigator).standalone === true
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

// On iOS only Safari can add to the home screen. Third-party iOS browsers
// (Chrome/Firefox/Edge/Opera, the Google app) and in-app webviews
// (Instagram, Facebook, ...) use WebKit but can't, so we treat them as
// unsupported.
function detectIOSSafari(): boolean {
  if (!detectIOS()) return false;

  const ua = window.navigator.userAgent;
  const isOtheriOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua);
  const isInAppBrowser =
    /FBAN|FBAV|FB_IAB|Instagram|Line|Twitter|TikTok|Snapchat/i.test(ua);

  return !isOtheriOSBrowser && !isInAppBrowser;
}

// Shared install state. Lives at module scope so every consumer (the floating
// banner and the sidebar banner) reads the same captured prompt; consuming it
// once clears it everywhere. `ready` stays false until client detection runs,
// which keeps SSR/first paint from flashing install UI.
interface IInstallState {
  deferredPrompt: IBeforeInstallPromptEvent | null;
  isStandalone: boolean;
  isIOS: boolean;
  isIOSSafari: boolean;
  ready: boolean;
}

const SERVER_STATE: IInstallState = {
  deferredPrompt: null,
  isStandalone: false,
  isIOS: false,
  isIOSSafari: false,
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
    isIOSSafari: detectIOSSafari(),
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

  // The prompt is one-shot: clear it for all consumers before awaiting so a
  // second banner can't call prompt() again on the same event.
  setState({ deferredPrompt: null });

  await deferredPrompt.prompt();
  await deferredPrompt.userChoice;
}

export function useInstallPrompt() {
  const { deferredPrompt, isStandalone, isIOS, isIOSSafari, ready } =
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Only surface install UI when installation can actually work: either a
  // native prompt was captured (Chromium), or it's iOS Safari (manual add to
  // home screen). Unsupported browsers get nothing. Hidden once installed.
  const canInstall = deferredPrompt !== null;
  const canShowInstallUI =
    ready && !isStandalone && (canInstall || isIOSSafari);

  return { canInstall, canShowInstallUI, isIOS, isStandalone, promptInstall };
}
