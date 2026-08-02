import type { ReactNode } from "react";

import ErrorState from "@/components/custom/common/error-state";

interface IAsyncSectionProps {
  /** From useAuthedQuery's `pending`, or useDataPending. Never a query's isLoading. */
  pending: boolean;
  error?: unknown;
  isEmpty?: boolean;
  /** Shown while pending. Should mirror `children` closely enough that nothing shifts. */
  skeleton: ReactNode;
  /** Defaults to the shared ErrorState. Override for a retry or a way back. */
  errorState?: ReactNode;
  /** Shown when the fetch succeeded with nothing in it. Falls through to children if unset. */
  empty?: ReactNode;
  children: ReactNode;
}

/**
 * Picks which of the four states a data-backed section renders, in a fixed
 * order: pending, then error, then empty, then the data.
 *
 * The order being structural is the point. Every page used to hand-write this
 * ternary chain, and several checked error or emptiness before loading had
 * finished, so a cold cache painted "Greška" or "(0)" for a frame. There is no
 * way to express that mistake through this component.
 *
 * Auth is deliberately absent: a missing session replaces the whole page rather
 * than one section, so callers return LoginRequired early off `requiresAuth`.
 */
export default function AsyncSection({
  pending,
  error,
  isEmpty = false,
  skeleton,
  errorState,
  empty,
  children,
}: IAsyncSectionProps) {
  if (pending) return <>{skeleton}</>;

  if (error) return <>{errorState ?? <ErrorState error={error} />}</>;

  if (isEmpty && empty) return <>{empty}</>;

  return <>{children}</>;
}
