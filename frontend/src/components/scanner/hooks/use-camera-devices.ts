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
          availableDevices.filter(
            // Before permission is granted the spec returns one placeholder per
            // kind with every field blank. Radix Select throws on an empty item
            // value, so a placeholder reaching CameraSelect takes down the dialog.
            (device) => device.kind === "videoinput" && device.deviceId,
          ),
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
