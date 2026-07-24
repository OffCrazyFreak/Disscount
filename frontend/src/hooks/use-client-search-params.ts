"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Query string that, unlike useSearchParams, keeps its caller in the static prerender. */
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
