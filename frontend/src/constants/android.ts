// The Android app is a Trusted Web Activity wrapping this same origin, so the
// package id doubles as the manifest's related_applications id and the Play link.
export const PLAY_PACKAGE_ID = "me.disscount.app";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE_ID}`;

// Gated until the Play listing is public; flip to false once the app is live so
// the install banners start offering the Play download.
export const PLAY_STORE_COMING_SOON = true;
