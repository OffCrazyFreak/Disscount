"use client";

import { useEffect, useRef, useState } from "react";
import type { RenderOptions } from "bwip-js/browser";
import { findSymbology } from "./symbologies";
import { drawLogoOverlay } from "./logo-overlay";

export interface IBwipRenderInput {
  bcid: string;
  text: string;
  scale: number;
  includetext: boolean;
  barcolor: string;
  backgroundcolor: string;
  output: "canvas" | "svg";
  logo: boolean;
}

export function buildBwipOptions(input: IBwipRenderInput): RenderOptions {
  const symbology = findSymbology(input.bcid);
  const withLogo = input.logo && input.bcid === "qrcode";

  return {
    bcid: input.bcid,
    text: input.text,
    scale: input.scale,
    barcolor: input.barcolor,
    backgroundcolor: input.backgroundcolor,
    ...(symbology.is2d
      ? {}
      : { height: 12, includetext: input.includetext, textxalign: "center" }),
    ...(withLogo ? { eclevel: "H" } : {}),
  };
}

export function useBwipRender(input: IBwipRenderInput) {
  const { bcid, text, scale, includetext, barcolor, backgroundcolor, output, logo } = input;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const options = buildBwipOptions({
      bcid,
      text,
      scale,
      includetext,
      barcolor,
      backgroundcolor,
      output,
      logo,
    });

    async function render() {
      try {
        const bwipjs = (await import("bwip-js/browser")).default;
        if (cancelled) return;

        if (output === "svg") {
          setSvg(bwipjs.toSVG(options));
        } else if (canvasRef.current) {
          bwipjs.toCanvas(canvasRef.current, options);

          if (logo && bcid === "qrcode") {
            await drawLogoOverlay(canvasRef.current, "/disscount-logo.png");
          }
        }

        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    if (text) render();

    return () => {
      cancelled = true;
    };
  }, [bcid, text, scale, includetext, barcolor, backgroundcolor, output, logo]);

  return { canvasRef, svg, error };
}
