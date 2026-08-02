"use client";

import { useEffect, useMemo, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { SCAN_FORMATS_BY_PRESET } from "@/constants/scanner";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";
import ScanOverlay from "@/components/scanner/scan-overlay";
import usePageVisible from "@/hooks/use-page-visible";
import "@/components/scanner/scanner.css";

// The library defaults to 500 without a tracker; 750 measurably slowed
// decoding of a real barcode, which is this feature's whole job.
const CAMERA_SCAN_RETRY_DELAY = 400;
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
  const isPageVisible = usePageVisible();

  // Ideals only on the axes: min and max are both mandatory, so either one lets a
  // device with no conforming mode raise OverconstrainedError, and the error copy
  // blames the camera choice, which is not what went wrong. Capping at 720p also
  // cost real detail across an EAN-13's bars at arm's length. frameRate keeps its
  // max because every camera has a mode at or under 30fps, and uncapped means
  // 60fps of decode work for no extra accuracy. exact on deviceId stays, since a
  // bare id is only a hint.
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

      // The torch is reset per stream, the notification only once. Latching both
      // together skipped the reset on the stream rebuilt after a tab switch, so
      // a device that remembers the torch came back with it still lit.
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
