import { useEffect, useState } from "react";

import { ImageProcessingError } from "@/utils/browser/image";
import { prepareProductPhoto } from "@/utils/browser/product-photo";

type PrepareState =
  | { status: "idle" }
  | { status: "preparing" }
  | { status: "ready"; blob: Blob; previewUrl: string }
  | { status: "error"; code: ImageProcessingError["code"] };

/** Turns a picked file into the JPEG we upload, with a preview URL that is revoked when replaced. */
export function usePreparedPhoto() {
  const [state, setState] = useState<PrepareState>({ status: "idle" });
  const previewUrl = state.status === "ready" ? state.previewUrl : null;

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function pick(file: File) {
    setState({ status: "preparing" });
    try {
      const blob = await prepareProductPhoto(file);
      setState({
        status: "ready",
        blob,
        previewUrl: URL.createObjectURL(blob),
      });
    } catch (error) {
      setState({
        status: "error",
        code:
          error instanceof ImageProcessingError ? error.code : "cannotProcess",
      });
    }
  }

  function reset() {
    setState({ status: "idle" });
  }

  return { state, pick, reset };
}
