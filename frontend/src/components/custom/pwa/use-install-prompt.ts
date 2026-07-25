"use client";

import { useSyncExternalStore } from "react";

import { PLAY_PACKAGE_ID, PLAY_STORE_COMING_SOON } from "@/constants/android";

// Captured so installation can be triggered from our own button.
interface IBeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// iOS Safari exposes a non-standard `navigator.standalone` flag.
interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

interface IRelatedApp {
  platform: string;
  id?: string;
  url?: string;
}

// Chromium-only, and only answers for apps listed in the manifest's related_applications.
interface IRelatedAppsNavigator extends Navigator {
  getInstalledRelatedApps?: () => Promise<IRelatedApp[]>;
}

// True inside the Trusted Web Activity and inside the installed PWA alike.
function detectStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as IOSNavigator).standalone === true
  );
}

function detectAndroid(): boolean {
  return /android/i.test(window.navigator.userAgent);
}

// Lets a browser tab know the Play build is already on the device, so we stop
// offering an install the user has effectively already done.
async function detectPlayApp(): Promise<boolean> {
  const navigatorWithRelatedApps = window.navigator as IRelatedAppsNavigator;
  if (!navigatorWithRelatedApps.getInstalledRelatedApps) return false;

  try {
    const apps = await navigatorWithRelatedApps.getInstalledRelatedApps();

    return apps.some((app) => app.id === PLAY_PACKAGE_ID);
  } catch {
    return false;
  }
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
  if (!detectIOS()) return false;

  return !/FBAN|FBAV|FB_IAB|Instagram|Line|Twitter|TikTok|Snapchat/i.test(
    window.navigator.userAgent,
  );
}

// Module scope, so both banners share one prompt and consuming it clears both.
// ready stays false until client detection runs, so SSR and first paint never flash install UI.
interface IInstallState {
  deferredPrompt: IBeforeInstallPromptEvent | null;
  isStandalone: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isIOSInstallCapable: boolean;
  hasPlayApp: boolean;
  ready: boolean;
}

const SERVER_STATE: IInstallState = {
  deferredPrompt: null,
  isStandalone: false,
  isAndroid: false,
  isIOS: false,
  isIOSInstallCapable: false,
  hasPlayApp: false,
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
// ready flips only after the async related-apps lookup, so install UI never
// flashes at someone who already has the app from Google Play.
async function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setState({ deferredPrompt: event as IBeforeInstallPromptEvent });
  });

  window.addEventListener("appinstalled", () => {
    setState({ deferredPrompt: null, isStandalone: true });
  });

  const hasPlayApp = await detectPlayApp();

  setState({
    isStandalone: detectStandalone(),
    isAndroid: detectAndroid(),
    isIOS: detectIOS(),
    isIOSInstallCapable: detectIOSInstallCapable(),
    hasPlayApp,
    ready: true,
  });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  void init();

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
    isAndroid,
    isIOS,
    isIOSInstallCapable,
    hasPlayApp,
    ready,
  } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Only show install UI where installing can actually work, and never to
  // someone already running the app or holding the Play build.
  const canInstall = deferredPrompt !== null;
  const canShowInstallUI =
    ready &&
    !isStandalone &&
    !hasPlayApp &&
    (canInstall || isIOSInstallCapable);
  const canShowPlayStore =
    canShowInstallUI && isAndroid && !PLAY_STORE_COMING_SOON;

  return {
    canInstall,
    canShowInstallUI,
    canShowPlayStore,
    isIOS,
    isStandalone,
    promptInstall,
  };
}
