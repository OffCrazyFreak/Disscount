"use client";

import { useEffect, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import type { DotType, Options } from "qr-code-styling";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DOT_TYPES: DotType[] = ["square", "rounded", "dots", "classy-rounded"];

const PRESETS: Record<string, Options["dotsOptions"]> = {
  ink: { color: "#111111" },
  brand: { color: "#16a34a" },
  gradient: {
    gradient: {
      type: "linear",
      rotation: Math.PI / 4,
      colorStops: [
        { offset: 0, color: "#15803d" },
        { offset: 1, color: "#111111" },
      ],
    },
  },
};

function buildOptions(
  value: string,
  dotType: DotType,
  preset: string,
  logo: boolean,
): Partial<Options> {
  return {
    width: 260,
    height: 260,
    data: value || " ",
    image: logo ? "/disscount-logo.png" : undefined,
    dotsOptions: { type: dotType, ...PRESETS[preset] },
    cornersSquareOptions: { type: "extra-rounded" },
    backgroundOptions: { color: "#ffffff" },
    imageOptions: { margin: 6, imageSize: 0.3 },
    qrOptions: { errorCorrectionLevel: logo ? "H" : "Q" },
  };
}

interface IStyledQrGeneratorProps {
  value: string;
}

export default function StyledQrGenerator({ value }: IStyledQrGeneratorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [dotType, setDotType] = useState<DotType>("rounded");
  const [preset, setPreset] = useState("brand");
  const [logo, setLogo] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const { default: QRCodeStylingLib } = await import("qr-code-styling");
      if (cancelled || !containerRef.current) return;

      const options = buildOptions(value, dotType, preset, logo);

      if (!qrRef.current) {
        qrRef.current = new QRCodeStylingLib(options);
        qrRef.current.append(containerRef.current);
      } else {
        qrRef.current.update(options);
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [value, dotType, preset, logo]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Dot style</Label>
          <Select
            value={dotType}
            onValueChange={(v) => setDotType(v as DotType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Color preset</Label>
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(PRESETS).map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-end gap-2 pb-2 text-sm">
          <Switch checked={logo} onCheckedChange={setLogo} />
          Logo
        </label>
      </div>

      <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed bg-white p-6">
        <div ref={containerRef} className="[&_canvas]:h-auto [&_canvas]:max-w-full" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => qrRef.current?.download({ name: "disscount-qr", extension: "png" })}
      >
        <Download /> Download
      </Button>

      <p className="text-xs text-muted-foreground">
        Heavier styling lowers scan tolerance. Always verify a styled QR in the
        Scan tab before using it anywhere real.
      </p>
    </div>
  );
}
