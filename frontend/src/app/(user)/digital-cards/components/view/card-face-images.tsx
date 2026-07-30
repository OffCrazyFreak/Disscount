"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface ICardFaceImagesProps {
  frontImage: string | null;
  backImage: string | null;
}

interface IFace {
  label: string;
  src: string;
}

/** The backup a cashier reads when the generated code will not scan, so it must zoom. */
export default function CardFaceImages({
  frontImage,
  backImage,
}: ICardFaceImagesProps) {
  const [zoomed, setZoomed] = useState<IFace | null>(null);

  const faces: IFace[] = [
    ...(frontImage ? [{ label: "Prednja strana", src: frontImage }] : []),
    ...(backImage ? [{ label: "Stražnja strana", src: backImage }] : []),
  ];

  if (faces.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Slike kartice</p>

      <div className="grid grid-cols-2 gap-3">
        {faces.map((face) => (
          <button
            key={face.label}
            type="button"
            onClick={() =>
              setZoomed((current) =>
                current?.label === face.label ? null : face,
              )
            }
            aria-label={
              zoomed?.label === face.label
                ? `Smanji ${face.label}`
                : `Povećaj ${face.label}`
            }
            className="cursor-pointer overflow-hidden rounded-md border transition hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {/* A data URI, so next/image would only add a proxy hop. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={face.src}
              alt={face.label}
              className={cn(
                "w-full object-cover transition-all",
                zoomed?.label === face.label ? "aspect-auto" : "aspect-3/2",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
