let context: AudioContext | null = null;

/** Create the audio context while the user gesture that opened the scanner is still fresh. */
export function prepareBeep() {
  if (typeof window === "undefined" || !window.AudioContext) return;

  context ??= new AudioContext();
  void context.resume().catch(() => {});
}

// iOS Safari ignores the library's sound option for muted video, so beep ourselves, once per emitted code.
export function playBeep() {
  if (!context || context.state !== "running") return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.frequency.value = 1000;
  gain.gain.setValueAtTime(0.15, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
}
