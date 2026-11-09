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

/** Next's boundaries drop the component stack, so only componentDidCatch sees it; rethrow keeps Next's page. */
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
