import { useEffect, useState } from "react";

/** Object URL for a picked file, revoked when the file changes or the component unmounts. */
export function useObjectUrl(
  file: File | null | undefined,
): string | undefined {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return file ? url : undefined;
}
