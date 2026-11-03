"use client";
// react-scan must be imported before react
import { scan } from "react-scan";
import { JSX, useEffect } from "react";
import { clientEnv } from "@/lib/env";

// Render profiling overlay, opt-in via NEXT_PUBLIC_ENABLE_REACT_SCAN=true.
export default function ReactScan(): JSX.Element {
  useEffect(() => {
    if (!clientEnv.NEXT_PUBLIC_ENABLE_REACT_SCAN) return;

    scan({ enabled: true });
  }, []);

  return <></>;
}
