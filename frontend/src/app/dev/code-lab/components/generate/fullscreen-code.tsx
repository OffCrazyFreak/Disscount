"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useBwipRender } from "./use-bwip-render";
import { useWakeLock } from "./use-wake-lock";

interface IFullscreenCodeProps {
  value: string;
  bcid: string;
  onClose: () => void;
}

export default function FullscreenCode({
  value,
  bcid,
  onClose,
}: IFullscreenCodeProps) {
  useWakeLock(true);

  const { canvasRef, error } = useBwipRender({
    bcid,
    text: value,
    scale: 6,
    includetext: false,
    barcolor: "#000000",
    backgroundcolor: "#ffffff",
    output: "canvas",
    logo: false,
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-svh w-svw max-w-none rounded-none border-0 bg-white p-6 text-neutral-900 sm:max-w-none">
        <DialogTitle className="sr-only">Fullscreen code</DialogTitle>

        <div className="flex h-full flex-col items-center justify-center gap-6">
          {error ? (
            <p className="max-w-sm text-center font-mono text-sm text-red-600">
              {error}
            </p>
          ) : (
            <canvas ref={canvasRef} className="h-auto max-w-full" />
          )}

          <p className="font-mono text-lg tracking-[0.2em] break-all text-center">
            {value}
          </p>
          <p className="text-xs text-neutral-400">
            Screen stays awake while this view is open
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
