"use client";

import { useState } from "react";
import { Download, Expand } from "lucide-react";
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
import { downloadDataUrl } from "@/utils/browser/file";
import { SYMBOLOGIES, findSymbology } from "./symbologies";
import { useBwipRender } from "./use-bwip-render";
import FullscreenCode from "./fullscreen-code";

interface IBwipGeneratorProps {
  value: string;
}

export default function BwipGenerator({ value }: IBwipGeneratorProps) {
  const [bcid, setBcid] = useState("qrcode");
  const [output, setOutput] = useState<"canvas" | "svg">("canvas");
  const [includetext, setIncludetext] = useState(true);
  const [logo, setLogo] = useState(false);
  const [barcolor, setBarcolor] = useState("#111111");
  const [backgroundcolor, setBackgroundcolor] = useState("#ffffff");
  const [fullscreen, setFullscreen] = useState(false);

  const symbology = findSymbology(bcid);
  const { canvasRef, svg, error } = useBwipRender({
    bcid,
    text: value,
    scale: 3,
    includetext,
    barcolor,
    backgroundcolor,
    output,
    logo,
  });

  function handleDownload() {
    if (output === "canvas") {
      const url = canvasRef.current?.toDataURL("image/png");
      if (url) downloadDataUrl(url, `code-${bcid}.png`);
    } else if (svg) {
      const blobUrl = URL.createObjectURL(
        new Blob([svg], { type: "image/svg+xml" }),
      );
      downloadDataUrl(blobUrl, `code-${bcid}.svg`);
      URL.revokeObjectURL(blobUrl);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Symbology</Label>
          <Select value={bcid} onValueChange={setBcid}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYMBOLOGIES.map((s) => (
                <SelectItem key={s.bcid} value={s.bcid}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Output</Label>
          <div className="flex gap-1">
            {(["canvas", "svg"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                size="sm"
                variant={output === mode ? "default" : "outline"}
                onClick={() => setOutput(mode)}
                className="flex-1 uppercase"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Colors</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={barcolor}
              onChange={(e) => setBarcolor(e.target.value)}
              aria-label="Bar color"
              className="h-8 w-full cursor-pointer rounded-md border bg-transparent"
            />
            <input
              type="color"
              value={backgroundcolor}
              onChange={(e) => setBackgroundcolor(e.target.value)}
              aria-label="Background color"
              className="h-8 w-full cursor-pointer rounded-md border bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {!symbology.is2d && (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={includetext} onCheckedChange={setIncludetext} />
            Human-readable text
          </label>
        )}

        {bcid === "qrcode" && output === "canvas" && (
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={logo} onCheckedChange={setLogo} />
            Disscount logo overlay
          </label>
        )}
      </div>

      <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed bg-white p-6">
        {error ? (
          <p className="max-w-sm text-center font-mono text-sm text-destructive">
            {error}
          </p>
        ) : output === "svg" ? (
          <div
            className="max-w-full [&_svg]:h-auto [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : null}

        <canvas
          ref={canvasRef}
          className={
            output === "canvas" && !error ? "h-auto max-w-full" : "hidden"
          }
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleDownload}>
          <Download /> Download
        </Button>
        <Button type="button" variant="outline" onClick={() => setFullscreen(true)}>
          <Expand /> Till mode
        </Button>
      </div>

      {fullscreen && (
        <FullscreenCode
          value={value}
          bcid={bcid}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}
