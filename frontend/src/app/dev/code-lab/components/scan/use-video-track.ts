"use client";

import { RefObject, useEffect, useState } from "react";

export function useVideoTrack(containerRef: RefObject<HTMLDivElement | null>) {
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const interval = window.setInterval(() => {
      const video = container.querySelector("video");
      const stream = (video?.srcObject as MediaStream | null) ?? null;
      const found = stream?.getVideoTracks()[0] ?? null;

      if (found && found.readyState === "live") {
        setTrack((prev) => (prev?.id === found.id ? prev : found));
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [containerRef]);

  return track;
}
