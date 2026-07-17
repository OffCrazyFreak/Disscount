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
