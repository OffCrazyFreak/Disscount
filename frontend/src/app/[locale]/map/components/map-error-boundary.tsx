"use client";

import { Component, ReactNode } from "react";

interface IMapErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface IMapErrorBoundaryState {
  failed: boolean;
}

/**
 * MapLibre 6 throws from its constructor when the device has no WebGL2. The
 * list beside the map already holds every store, so the map area just says so
 * instead of taking the page down. A class, because only a class can catch.
 */
export default class MapErrorBoundary extends Component<
  IMapErrorBoundaryProps,
  IMapErrorBoundaryState
> {
  state: IMapErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): IMapErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[map] could not start", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
