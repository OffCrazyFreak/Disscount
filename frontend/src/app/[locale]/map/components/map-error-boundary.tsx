"use client";

import { Component, ReactNode } from "react";

import { reloadAfterChunkLoadError } from "@/lib/pwa/chunk-load-recovery";

interface IMapErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface IMapErrorBoundaryState {
  failed: boolean;
}

/** MapLibre 6 throws from its constructor without WebGL2; a class because only a class can catch. */
export default class MapErrorBoundary extends Component<
  IMapErrorBoundaryProps,
  IMapErrorBoundaryState
> {
  state: IMapErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): IMapErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // A stale MapLibre chunk after a deploy is caught here before the route boundary could recover it.
    if (reloadAfterChunkLoadError(error)) return;

    console.warn("[map] could not start", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
