"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Query string read on the client only. Unlike useSearchParams it does not pull
 * its caller out of the static prerender, so nav links stay in the served HTML;
 * the trade is that it returns null until mounted.
 */
export function useClientSearchParams(): URLSearchParams | null {
  const pathname = usePathname();
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    function sync() {
      setParams(new URLSearchParams(window.location.search));
    }

    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);

  return params;
}
