function scoreCamera(label: string, index: number): number {
  const name = label.toLowerCase();
  let score = 0;

  if (/back|rear|environment/.test(name)) score += 10;
  if (/front|user|face|selfie/.test(name)) score -= 20;
  if (/ultra|tele|zoom|macro|depth|infrared|0\.5/.test(name)) score -= 8;
  if (/camera2 0|camera 0\b/.test(name)) score += 3;
  if (name === "back camera") score += 3;

  return score - index * 0.1;
}

// Labels exist only after permission is granted, so this can return null.
export function pickBackCamera(devices: MediaDeviceInfo[]): string | null {
  // Counted before filtering: some browsers label only the granted device, so
  // counting labels treated a multi-camera phone as single-camera and handed the
  // choice back to the platform, which on Android often means the front lens.
  if (devices.length < 2) return null;

  const labeledDevices = devices.filter((device) => device.label);

  // The browser already has to use the only camera. Waiting for its label and
  // then selecting it explicitly would just restart the same stream.
  if (labeledDevices.length === 0) return null;

  const scored = labeledDevices
    .map((device, index) => ({
      deviceId: device.deviceId,
      score: scoreCamera(device.label, index),
    }))
    .sort((a, b) => b.score - a.score);

  // A negative score means the best label we can see is a front or specialty
  // lens, which happens when the browser labels only the granted device. Naming
  // it explicitly would pin the scanner to it; null falls back to facingMode,
  // which is the whole reason this can return null.
  const best = scored[0];

  return best && best.score >= 0 ? best.deviceId : null;
}

export type CameraFacing = "front" | "back" | "unknown";
export type CameraLens = "ultrawide" | "telephoto" | "macro" | "main";

interface INamedCamera {
  deviceId: string;
  facing: CameraFacing;
  lens: CameraLens;
  /** 0 when the name is already unique, otherwise the 1-based position among identical names. */
  ordinal: number;
  rawLabel: string;
}

function nativeCameraIndex(label: string, fallback: number): number {
  const match = label.toLowerCase().match(/camera2?\s+(\d+)/);

  return match ? Number(match[1]) : fallback;
}

function cameraFacing(label: string): CameraFacing {
  const name = label.toLowerCase();

  if (/front|user|selfie|prednja/.test(name)) return "front";
  if (/back|rear|environment|stražnja/.test(name)) return "back";

  return "unknown";
}

function cameraLens(label: string): CameraLens {
  const name = label.toLowerCase();

  if (/ultra/.test(name)) return "ultrawide";
  if (/tele|zoom/.test(name)) return "telephoto";
  if (/macro|makro/.test(name)) return "macro";

  return "main";
}

function facingRank(facing: CameraFacing): number {
  if (facing === "back") return 0;
  if (facing === "front") return 1;

  return 2;
}

/**
 * Map raw OS camera labels ("camera2 0, facing back"...) to structured names the
 * caller translates: back cameras first, then front, each ordered and numbered by
 * the native camera index (camera 0 is usually the main sensor).
 */
export function formatCameraLabels(devices: MediaDeviceInfo[]): INamedCamera[] {
  const named = devices
    .map((device, index) => ({
      deviceId: device.deviceId,
      rawLabel: device.label,
      facing: cameraFacing(device.label),
      lens: cameraLens(device.label),
      order: nativeCameraIndex(device.label, index),
    }))
    .sort(
      (a, b) =>
        facingRank(a.facing) - facingRank(b.facing) || a.order - b.order,
    );

  const nameKey = (camera: { facing: CameraFacing; lens: CameraLens }) =>
    `${camera.facing}:${camera.lens}`;

  const totals = new Map<string, number>();
  named.forEach((camera) => {
    totals.set(nameKey(camera), (totals.get(nameKey(camera)) ?? 0) + 1);
  });

  const seen = new Map<string, number>();

  return named.map(({ order: _order, ...camera }) => {
    if ((totals.get(nameKey(camera)) ?? 0) < 2)
      return { ...camera, ordinal: 0 };

    const ordinal = (seen.get(nameKey(camera)) ?? 0) + 1;
    seen.set(nameKey(camera), ordinal);

    return { ...camera, ordinal };
  });
}

export type ScannerErrorKey =
  | "permissionDenied"
  | "noCamera"
  | "inUse"
  | "overconstrained"
  | "insecureContext"
  | "generic";

/** Returns a `scanner.errors.*` key; the caller translates it. */
export function describeScannerError(error: unknown): ScannerErrorKey {
  const kind =
    error && typeof error === "object" && "kind" in error
      ? String((error as { kind: unknown }).kind)
      : null;

  switch (kind) {
    case "permission-denied":
      return "permissionDenied";
    case "no-camera":
      return "noCamera";
    case "in-use":
      return "inUse";
    case "overconstrained":
      return "overconstrained";
    case "insecure-context":
      return "insecureContext";
    default:
      return "generic";
  }
}
