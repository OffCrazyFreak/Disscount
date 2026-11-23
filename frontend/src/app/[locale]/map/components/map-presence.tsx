"use client";

import { useEffect, useEffectEvent } from "react";

interface IMapPresenceProps {
  onChange: (isLive: boolean) => void;
}

/** Rendered among the map's children, which mount only while a live map exists, so it reports whether one does. */
export default function MapPresence({ onChange }: IMapPresenceProps) {
  const report = useEffectEvent(onChange);

  useEffect(() => {
    report(true);
    return () => report(false);
  }, []);

  return null;
}
