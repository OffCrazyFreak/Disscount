"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { parseModalParam } from "@/lib/modal/modal-param-parser";
import {
  closeModalUrl,
  openModalUrl,
  swapModalUrl,
} from "@/lib/modal/modal-navigation";

/** Callers must sit under <Suspense>; components only opening modals should import openModalUrl. */
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
