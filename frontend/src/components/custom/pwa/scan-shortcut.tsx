"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useClientSearchParams } from "@/hooks/use-client-search-params";
import { useCameraScanner } from "@/context/scanner-context";
import useProductNavigation from "@/hooks/use-product-navigation";
import { IScannedCode } from "@/typings/scanned-code";

// Serves the manifest's "Skeniraj" app shortcut, whose url is /?scan=1. The
// flag is dropped from the URL before the camera opens so that a refresh, a
// back navigation or a shared link does not reopen it.
export default function ScanShortcut() {
  const params = useClientSearchParams();
  const pathname = usePathname();
  const { openScanner } = useCameraScanner();
  const navigateToProduct = useProductNavigation();
  const opened = useRef(false);

  useEffect(() => {
    if (params?.get("scan") !== "1") {
      opened.current = false;
      return;
    }

    if (opened.current) return;

    opened.current = true;

    const rest = new URLSearchParams(params);
    rest.delete("scan");
    const query = rest.toString();
    window.history.replaceState(
      null,
      "",
      pathname + (query ? `?${query}` : ""),
    );

    openScanner({
      onScan: (code: IScannedCode) => {
        const ean = code.rawValue.trim();
        if (ean) navigateToProduct(ean);
      },
    });
  }, [params, pathname, openScanner, navigateToProduct]);

  return null;
}
