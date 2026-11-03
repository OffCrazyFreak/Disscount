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

/**
 * The white square every product photo sits on. The files already carry white padding; this box
 * is the fallback while loading. color-scheme keeps Chrome's auto dark mode off the image, and
 * forced-color-adjust keeps Windows high contrast from repainting the white.
 */
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
        // A plain img, never a CSS background: dark mode extensions hide or invert large light backgrounds.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          draggable={false}
          onError={onError}
          className={cn("size-full object-contain", imgClassName)}
        />
      )}
      {children}
    </div>
  );
}
