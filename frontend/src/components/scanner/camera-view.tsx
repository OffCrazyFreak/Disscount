"use client";

import { useEffect, useMemo, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { SCAN_FORMATS_BY_PRESET } from "@/constants/scanner";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";
import ScanOverlay from "@/components/scanner/scan-overlay";
import usePageVisible from "@/hooks/use-page-visible";
import "@/components/scanner/scanner.css";

// 750 slowed decoding; cards need four reads in 1.5 s, which 400 ms cannot fit; products need two.
const RETRY_DELAY_BY_PRESET: Record<ScanPreset, number> = {
  all: 200,
  product: 400,
};
const CAMERA_TRACK_POLL_INTERVAL = 300;
const CAMERA_TRACK_POLL_LIMIT = 20;

const CAMERA_COMPONENTS = {
  finder: true,
  torch: true,
  zoom: true,
  onOff: true,
};

interface ICameraViewProps {
  preset: ScanPreset;
  deviceId?: string;
  onDetect: (codes: IScannedCode[]) => void;
  onError: (error: unknown) => void;
  onCameraReady: () => void;
}

function getVideoTrack(video: HTMLVideoElement | null) {
  const stream = (video?.srcObject as MediaStream | null) ?? null;

  return stream?.getVideoTracks()[0] ?? null;
}

function turnTorchOff(track: MediaStreamTrack | null) {
  track
    ?.applyConstraints({
      advanced: [{ torch: false } as MediaTrackConstraintSet],
    })
    .catch(() => {});
}

function stopVideo(video: HTMLVideoElement | null) {
  const stream = (video?.srcObject as MediaStream | null) ?? null;

  for (const track of stream?.getTracks() ?? []) {
    track.stop();
  }

  if (video) video.srcObject = null;
}

export default function CameraView({
  preset,
  deviceId,
  onDetect,
  onError,
  onCameraReady,
}: ICameraViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPageVisible = usePageVisible();

  // Ideals only, or a device can raise OverconstrainedError; frameRate capped to avoid 60fps decode work.
  const constraints = useMemo(
    () => ({
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 24, max: 30 },
      ...(deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: "environment" as const }),
    }),
    [deviceId],
  );

  // Some devices remember the torch across streams, so force it off on start.
  useEffect(() => {
    const video =
      containerRef.current?.querySelector<HTMLVideoElement>("video") ?? null;
    let attempts = 0;
    let hasNotifiedReady = false;

    function handleCameraReady() {
      const track = getVideoTrack(video);

      if (!track) return;

      // Reset per stream, notified once, so a remembering device does not come back lit.
      turnTorchOff(track);

      if (hasNotifiedReady) return;

      hasNotifiedReady = true;
      onCameraReady();
    }

    video?.addEventListener("playing", handleCameraReady);
    handleCameraReady();

    const timer = window.setInterval(() => {
      const track = getVideoTrack(video);
      attempts += 1;

      if (!track && attempts < CAMERA_TRACK_POLL_LIMIT) return;

      window.clearInterval(timer);
      handleCameraReady();
    }, CAMERA_TRACK_POLL_INTERVAL);

    return () => {
      window.clearInterval(timer);
      video?.removeEventListener("playing", handleCameraReady);
      turnTorchOff(getVideoTrack(video));
      stopVideo(video);
    };
  }, [deviceId, onCameraReady]);

  return (
    <div
      ref={containerRef}
      className="scanner-finder-recolor relative overflow-hidden rounded-xl bg-black"
    >
      <ScanOverlay />

      {/* Remount per camera: the library only re-applies constraints to the live track. */}
      <Scanner
        key={deviceId ?? "auto"}
        onScan={(codes) =>
          onDetect(
            codes.map((c) => ({ rawValue: c.rawValue, format: c.format })),
          )
        }
        // Consensus counts repeated reads, which the library drops by default.
        allowMultiple
        scanDelay={0}
        onError={onError}
        formats={SCAN_FORMATS_BY_PRESET[preset]}
        constraints={constraints}
        retryDelay={RETRY_DELAY_BY_PRESET[preset]}
        paused={!isPageVisible}
        sound={false}
        components={CAMERA_COMPONENTS}
      />
    </div>
  );
}
