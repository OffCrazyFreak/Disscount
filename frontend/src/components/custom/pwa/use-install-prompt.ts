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

// Other iOS browsers and in-app webviews use WebKit but cannot install.
function detectIOSSafari(): boolean {
  if (!detectIOS()) return false;

  const ua = window.navigator.userAgent;
  const isOtheriOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua);
  const isInAppBrowser =
    /FBAN|FBAV|FB_IAB|Instagram|Line|Twitter|TikTok|Snapchat/i.test(ua);

  return !isOtheriOSBrowser && !isInAppBrowser;
}

// Module scope, so both banners share one prompt and consuming it clears both.
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

  // One-shot: clear before awaiting so a second banner can't reuse the event.
  setState({ deferredPrompt: null });

  await deferredPrompt.prompt();
  await deferredPrompt.userChoice;
}

export function useInstallPrompt() {
  const { deferredPrompt, isStandalone, isIOS, isIOSSafari, ready } =
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Only show install UI where installing can actually work.
  const canInstall = deferredPrompt !== null;
  const canShowInstallUI =
    ready && !isStandalone && (canInstall || isIOSSafari);

  return { canInstall, canShowInstallUI, isIOS, isStandalone, promptInstall };
}
