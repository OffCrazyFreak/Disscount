"use client";

import { useEffect, useState } from "react";

// Chrome/Edge fire `beforeinstallprompt` before showing their own install UI.
// We capture the event so we can trigger installation from our own button.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// iOS Safari exposes a non-standard `navigator.standalone` flag.
interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as IOSNavigator).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof window === "undefined") return false;

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

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(detectIOS());
    setIsIOSSafari(detectIOSSafari());
    setIsStandalone(detectStandalone());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    // The prompt can only be used once; drop it afterwards.
    setDeferredPrompt(null);
  }

  // Only surface install UI when installation can actually work: either a
  // native prompt was captured (Chromium), or it's iOS Safari (manual add to
  // home screen). Unsupported browsers get nothing. Hidden once installed.
  const canInstall = deferredPrompt !== null;
  const canShowInstallUI = !isStandalone && (canInstall || isIOSSafari);

  return { canInstall, canShowInstallUI, isIOS, isStandalone, promptInstall };
}
