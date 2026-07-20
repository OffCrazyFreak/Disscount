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

// Best-effort pick of the primary back lens; labels exist only after the
// camera permission is granted, so callers must tolerate a null result.
export function pickBackCamera(devices: MediaDeviceInfo[]): string | null {
  const scored = devices
    .filter((device) => device.label)
    .map((device, index) => ({
      deviceId: device.deviceId,
      score: scoreCamera(device.label, index),
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.deviceId ?? null;
}

interface INamedCamera {
  deviceId: string;
  label: string;
  rawLabel: string;
}

function nativeCameraIndex(label: string, fallback: number): number {
  const match = label.toLowerCase().match(/camera2?\s+(\d+)/);

  return match ? Number(match[1]) : fallback;
}

function baseCameraName(label: string): string {
  const name = label.toLowerCase();

  const facing = /front|user|selfie|prednja/.test(name)
    ? "Prednja kamera"
    : /back|rear|environment|stražnja/.test(name)
      ? "Stražnja kamera"
      : "Kamera";

  const lens = /ultra/.test(name)
    ? " (ultraširoka)"
    : /tele|zoom/.test(name)
      ? " (telefoto)"
      : /macro|makro/.test(name)
        ? " (makro)"
        : "";

  return facing + lens;
}

function facingRank(label: string): number {
  if (label.startsWith("Stražnja")) return 0;
  if (label.startsWith("Prednja")) return 1;

  return 2;
}

/**
 * Map raw OS camera labels ("camera2 0, facing back"...) to friendly Croatian
 * names: back cameras first, then front, each ordered and numbered by the
 * native camera index (camera 0 is usually the main sensor).
 */
export function formatCameraLabels(devices: MediaDeviceInfo[]): INamedCamera[] {
  const named = devices
    .map((device, index) => ({
      deviceId: device.deviceId,
      rawLabel: device.label,
      label: baseCameraName(device.label),
      order: nativeCameraIndex(device.label, index),
    }))
    .sort(
      (a, b) => facingRank(a.label) - facingRank(b.label) || a.order - b.order,
    );

  const totals = new Map<string, number>();
  named.forEach((camera) => {
    totals.set(camera.label, (totals.get(camera.label) ?? 0) + 1);
  });

  const seen = new Map<string, number>();

  return named.map(({ order: _order, ...camera }) => {
    if ((totals.get(camera.label) ?? 0) < 2) return camera;

    const ordinal = (seen.get(camera.label) ?? 0) + 1;
    seen.set(camera.label, ordinal);

    return { ...camera, label: `${camera.label} ${ordinal}` };
  });
}

export function describeScannerError(error: unknown): string {
  const kind =
    error && typeof error === "object" && "kind" in error
      ? String((error as { kind: unknown }).kind)
      : null;

  switch (kind) {
    case "permission-denied":
      return "Pristup kameri je odbijen. Omogućite kameru u postavkama preglednika pa pokušaj ponovno.";
    case "no-camera":
      return "Kamera nije pronađena na ovom uređaju.";
    case "in-use":
      return "Kameru trenutno koristi druga aplikacija. Zatvori je pa pokušaj ponovno.";
    case "overconstrained":
      return "Odabrana kamera nije dostupna. Vratite odabir kamere na automatski.";
    case "insecure-context":
      return "Skeniranje radi samo preko sigurne (HTTPS) veze.";
    default:
      return "Greška pri pokretanju kamere. Pokušaj ponovno.";
  }
}
