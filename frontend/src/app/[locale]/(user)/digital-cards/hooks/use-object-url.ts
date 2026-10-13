import { useEffect, useState } from "react";

interface IObjectUrl {
  file: File;
  url: string;
}

/** Object URL for a picked file, revoked when the file changes or the component unmounts. */
export function useObjectUrl(
  file: File | null | undefined,
): string | undefined {
  const [current, setCurrent] = useState<IObjectUrl>();

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent({ file, url });

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // After a file change the old url is already revoked, so it is never handed out.
  return file && current?.file === file ? current.url : undefined;
}
