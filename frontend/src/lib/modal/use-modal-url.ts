"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { parseModalParam } from "@/lib/modal/modal-registry";
import {
  closeModalUrl,
  openModalUrl,
  swapModalUrl,
} from "@/lib/modal/modal-navigation";

/**
 * Reactive companion to modal-navigation.ts: parses the current ?modal= target.
 * Uses useSearchParams, so any component calling this must sit under a
 * <Suspense> boundary (the ModalRouter in the root layout does). Components
 * that only OPEN modals should import openModalUrl directly instead.
 */
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
