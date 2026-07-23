"use client";
// react-scan must be imported before react
import { scan } from "react-scan";
import { JSX, useEffect } from "react";

// Render profiling overlay, opt-in via NEXT_PUBLIC_ENABLE_REACT_SCAN=true.
export default function ReactScan(): JSX.Element {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_REACT_SCAN !== "true") return;

    scan({ enabled: true });
  }, []);

  return <></>;
}
