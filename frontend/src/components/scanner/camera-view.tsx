"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { SCAN_FORMATS_BY_PRESET } from "@/constants/scanner";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";
import ScanOverlay from "@/components/scanner/scan-overlay";
import "@/components/scanner/scanner.css";

const CAMERA_SCAN_RETRY_DELAY = 750;
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
  onScan: (code: IScannedCode) => void;
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
  onScan,
  onError,
  onCameraReady,
}: ICameraViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // exact, because a bare deviceId is only an "ideal" hint the browser may ignore.
  const constraints = useMemo(
    () => ({
      width: { ideal: 1280, max: 1280 },
      height: { ideal: 720, max: 720 },
      frameRate: { ideal: 24, max: 30 },
      ...(deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: "environment" as const }),
    }),
    [deviceId],
  );

  useEffect(() => {
    function handleVisibilityChange() {
      setIsPageVisible(document.visibilityState === "visible");
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Some devices remember the torch across streams, so force it off on start.
  useEffect(() => {
    const video =
      containerRef.current?.querySelector<HTMLVideoElement>("video") ?? null;
    let attempts = 0;
    let hasNotifiedReady = false;

    function handleCameraReady() {
      const track = getVideoTrack(video);

      if (!track || hasNotifiedReady) return;

      hasNotifiedReady = true;
      turnTorchOff(track);
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
        onScan={(codes) => {
          if (codes[0]) {
            onScan({ rawValue: codes[0].rawValue, format: codes[0].format });
          }
        }}
        onError={onError}
        formats={SCAN_FORMATS_BY_PRESET[preset]}
        constraints={constraints}
        retryDelay={CAMERA_SCAN_RETRY_DELAY}
        paused={!isPageVisible}
        sound
        components={CAMERA_COMPONENTS}
      />
    </div>
  );
}
