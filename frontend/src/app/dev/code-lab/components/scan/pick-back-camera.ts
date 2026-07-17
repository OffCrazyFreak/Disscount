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

export function pickBackCamera(devices: MediaDeviceInfo[]): string | null {
  const scored = devices
    .filter((d) => d.label)
    .map((d, i) => ({ deviceId: d.deviceId, score: scoreCamera(d.label, i) }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.deviceId ?? null;
}
