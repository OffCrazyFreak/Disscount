"use client";

import { ChangeEvent, useId } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import resizeImageToWebp from "@/utils/browser/image";

// Only guards decoding: the WebP re-encode below sets the stored size.
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

interface ICardImageSlotProps {
  label: string;
  value: string | null;
  /** Long edge in pixels after the WebP re-encode. */
  maxSize: number;
  /** Character cap the backend enforces on the data URI. */
  maxLength: number;
  onChange: (value: string | null) => void;
  /** The compressed result, not the original file: the colour sampler reuses this decode. */
  onPicked?: (encoded: string) => void;
  className?: string;
}

export default function CardImageSlot({
  label,
  value,
  maxSize,
  maxLength,
  onChange,
  onPicked,
  className,
}: ICardImageSlotProps) {
  const inputId = useId();

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clearing it now means picking the same file again still fires onChange, which it
    // would not after a remove or a rejected upload.
    event.currentTarget.value = "";
    if (!file) return;

    if (file.size > MAX_SOURCE_BYTES) {
      toast.error("Slika je prevelika. Maksimalna veličina je 15 MB.");
      return;
    }

    try {
      const encoded = await resizeImageToWebp(file, maxSize);

      // Catches the doomed request before it is sent: @Size counts characters and a data
      // URI is ASCII, so the cap the backend applies is the same number.
      if (encoded.length > maxLength) {
        toast.error("Slika je prevelika, pokušaj s manjom fotografijom.");
        return;
      }

      onChange(encoded);
      onPicked?.(encoded);
    } catch {
      toast.error("Sliku nije moguće učitati, probaj JPG ili PNG.");
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        id={inputId}
      />

      <label
        htmlFor={inputId}
        aria-label={value ? `Promijeni ${label}` : `Dodaj ${label}`}
        className="relative block aspect-3/2 w-full cursor-pointer overflow-hidden rounded-md border border-dashed bg-muted/40 transition hover:border-primary"
      >
        {value ? (
          // A data URI, so next/image would only add a proxy hop.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <Camera aria-hidden="true" className="size-5" />
          </span>
        )}
      </label>

      <span className="text-xs text-muted-foreground">{label}</span>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
        >
          Ukloni
        </button>
      )}
    </div>
  );
}
