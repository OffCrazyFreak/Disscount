import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

/**
 * Get the scanner camera the user manually picked; undefined means auto-pick.
 */
export function getPreferredCamera(): string | undefined {
  return getAppStorage().preferredCameraId;
}

/**
 * Persist a manually picked scanner camera.
 */
export function setPreferredCamera(deviceId: string) {
  setAppStorage({ preferredCameraId: deviceId });
}

/**
 * Forget the manually picked scanner camera and return to auto-pick.
 */
export function clearPreferredCamera() {
  setAppStorage({ preferredCameraId: undefined });
}
