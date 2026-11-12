"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { StoreHoursDto } from "@/lib/api/schemas";
import type { OpeningStatus } from "@/lib/store-hours/opening-status";
import {
  type IStoreHoursNow,
  openingOf,
} from "@/lib/store-hours/store-opening";

const StoreHoursContext = createContext<IStoreHoursNow | null>(null);

interface IStoreHoursProviderProps {
  /** From `useStoreHoursNow`, read once per page. */
  hours: IStoreHoursNow | null;
  children: ReactNode;
}

/** One fetch and one clock for every row on a page, so no two badges disagree. */
export default function StoreHoursProvider({
  hours,
  children,
}: IStoreHoursProviderProps) {
  return <StoreHoursContext value={hours}>{children}</StoreHoursContext>;
}

export interface IStoreOpening {
  status: OpeningStatus;
  now: Date;
  /** Null when no source has hours for the store. */
  hours: StoreHoursDto | null;
}

export function useStoreOpening(key: string): IStoreOpening | null {
  const hours = useContext(StoreHoursContext);

  if (!hours) return null;

  return {
    status: openingOf(key, hours),
    now: hours.now,
    hours: hours.data.stores[key] ?? null,
  };
}
