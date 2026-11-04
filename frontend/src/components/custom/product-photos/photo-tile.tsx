import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IPhotoTileProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: "eager" | "lazy";
  onError?: () => void;
  children?: ReactNode;
}

/** This box is the loading fallback; color-scheme stops Chrome's auto dark mode, and forced-color-adjust stops Windows high contrast repainting the white. */
export default function PhotoTile({
  src,
  alt,
  className,
  imgClassName,
  loading = "lazy",
  onError,
  children,
}: IPhotoTileProps) {
  return (
    <div
      className={cn(
        "relative isolate aspect-square overflow-hidden rounded-xl bg-white ring-1 ring-black/5 [color-scheme:only_light] forced-color-adjust-none",
        className,
      )}
    >
      {src && (
        // A plain img, never a CSS background, which dark mode extensions hide or invert; absolute so the file's pixel size never stretches a tile.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          draggable={false}
          onError={onError}
          className={cn(
            "absolute inset-0 size-full object-contain",
            imgClassName,
          )}
        />
      )}
      {children}
    </div>
  );
}
