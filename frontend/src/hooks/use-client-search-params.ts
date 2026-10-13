"use client";

import { usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";

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
