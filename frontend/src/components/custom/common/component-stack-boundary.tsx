"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";

import { isChunkLoadError } from "@/lib/pwa/chunk-load-recovery";
import { captureBoundaryError } from "@/lib/sentry/capture-boundary-error";

interface IComponentStackBoundaryProps {
  children: ReactNode;
}

interface IComponentStackBoundaryState {
  hasError: boolean;
}

/** Next's redirect, notFound and bailout errors are control flow, not failures. */
function isNextControlFlow(error: unknown) {
  try {
    unstable_rethrow(error);
    return false;
  } catch {
    return true;
  }
}

/**
 * Reports a render or effect error with its component stack, then rethrows it so
 * Next's own boundary still shows the error page. Next keeps React's root error
 * callbacks to itself and its boundaries drop the stack, so only a
 * componentDidCatch can see it. The rethrow happens there because React skips
 * that callback when render throws. The later capture from global-error.tsx is
 * a no-op, because Sentry marks an error object once it is captured.
 */
export default class ComponentStackBoundary extends Component<
  IComponentStackBoundaryProps,
  IComponentStackBoundaryState
> {
  state: IComponentStackBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // handleBoundaryError reloads for a chunk error, and reports it only if that fails.
    if (!isChunkLoadError(error) && !isNextControlFlow(error))
      captureBoundaryError(error, info.componentStack ?? undefined);

    throw error;
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
