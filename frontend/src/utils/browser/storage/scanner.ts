import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

export function getPreferredCamera(): string | undefined {
  return getAppStorage().preferredCameraId;
}

export function setPreferredCamera(deviceId: string) {
  setAppStorage({ preferredCameraId: deviceId });
}

export function clearPreferredCamera() {
  setAppStorage({ preferredCameraId: undefined });
}
