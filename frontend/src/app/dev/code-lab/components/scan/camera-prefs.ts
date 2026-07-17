const PREFERRED_CAMERA_KEY = "code-lab:preferred-camera";

export function getPreferredCamera(): string | null {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(PREFERRED_CAMERA_KEY);
}

export function setPreferredCamera(deviceId: string): void {
  window.localStorage.setItem(PREFERRED_CAMERA_KEY, deviceId);
}

export function clearPreferredCamera(): void {
  window.localStorage.removeItem(PREFERRED_CAMERA_KEY);
}
