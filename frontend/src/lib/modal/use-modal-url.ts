"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { parseModalParam } from "@/lib/modal/modal-param-parser";
import {
  closeModalUrl,
  openModalUrl,
  swapModalUrl,
} from "@/lib/modal/modal-navigation";

/** Uses useSearchParams, so callers must sit under <Suspense>; components that only open modals should import openModalUrl directly. */
export function useModalUrl() {
  const searchParams = useSearchParams();

  const target = useMemo(() => parseModalParam(searchParams), [searchParams]);

  return {
    target,
    openModal: openModalUrl,
    closeModal: closeModalUrl,
    swapModal: swapModalUrl,
  };
}
