import { Camera, Expand } from "lucide-react";

import { cn } from "@/lib/utils";

interface IPhotoBandProps {
  /** "open" on a photo that opens the viewer, "add" on an empty tile that starts an upload. */
  action: "open" | "add";
  className?: string;
}

/** The dark strip along a photo's bottom edge that says it can be tapped, styled like the avatar's. */
export default function PhotoBand({ action, className }: IPhotoBandProps) {
  const Icon = action === "open" ? Expand : Camera;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-x-0 bottom-0 flex h-[30%] items-center justify-center bg-black/45 text-white",
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
