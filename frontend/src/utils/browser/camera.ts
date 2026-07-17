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

/**
 * Map raw OS camera labels ("camera2 0, facing back"...) to friendly Croatian
 * names, numbering duplicates in device order.
 */
export function formatCameraLabels(devices: MediaDeviceInfo[]): INamedCamera[] {
  const named = devices.map((device) => ({
    deviceId: device.deviceId,
    label: baseCameraName(device.label),
  }));

  const totals = new Map<string, number>();
  named.forEach((camera) => {
    totals.set(camera.label, (totals.get(camera.label) ?? 0) + 1);
  });

  const seen = new Map<string, number>();

  return named.map((camera) => {
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
      return "Pristup kameri je odbijen. Omogućite kameru u postavkama preglednika pa pokušajte ponovno.";
    case "no-camera":
      return "Kamera nije pronađena na ovom uređaju.";
    case "in-use":
      return "Kameru trenutno koristi druga aplikacija. Zatvorite je pa pokušajte ponovno.";
    case "overconstrained":
      return "Odabrana kamera nije dostupna. Vratite odabir kamere na automatski.";
    case "insecure-context":
      return "Skeniranje radi samo preko sigurne (HTTPS) veze.";
    default:
      return "Greška pri pokretanju kamere. Pokušajte ponovno.";
  }
}
