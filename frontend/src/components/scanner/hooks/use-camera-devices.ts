"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function useCameraDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const requestIdRef = useRef(0);

  const refreshDevices = useCallback(() => {
    const requestId = ++requestIdRef.current;
    const mediaDevices = navigator.mediaDevices;

    if (!mediaDevices?.enumerateDevices) return;

    void mediaDevices
      .enumerateDevices()
      .then((availableDevices) => {
        if (requestId !== requestIdRef.current) return;

        setDevices(
          availableDevices.filter((device) => device.kind === "videoinput"),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const mediaDevices = navigator.mediaDevices;

    refreshDevices();
    mediaDevices?.addEventListener("devicechange", refreshDevices);

    return () => {
      requestIdRef.current += 1;
      mediaDevices?.removeEventListener("devicechange", refreshDevices);
    };
  }, [refreshDevices]);

  return { devices, refreshDevices };
}
