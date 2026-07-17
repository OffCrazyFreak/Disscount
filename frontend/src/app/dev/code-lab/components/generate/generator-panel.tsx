"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { detectSymbology, ean13CheckDigit } from "./smart-value";
import { findSymbology } from "./symbologies";
import BwipGenerator from "./bwip-generator";
import StyledQrGenerator from "./styled-qr-generator";
import TestSheet from "./test-sheet";

const ENGINES = [
  { id: "bwip", label: "bwip-js" },
  { id: "styled", label: "qr-code-styling" },
] as const;

type GeneratorEngine = (typeof ENGINES)[number]["id"];

export default function GeneratorPanel() {
  const [value, setValue] = useState("4006381333931");
  const [engine, setEngine] = useState<GeneratorEngine>("bwip");

  const detected = findSymbology(detectSymbology(value));
  const checkDigit = ean13CheckDigit(value);

  return (
    <section className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="code-lab-value">Value</Label>
        <Input
          id="code-lab-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="EAN, card number, URL..."
          className="font-mono"
        />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="outline" className="font-mono text-xs">
            auto-detect: {detected.label}
          </Badge>

          {checkDigit !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 font-mono text-xs"
              onClick={() => setValue(value + checkDigit)}
            >
              + append EAN-13 check digit ({checkDigit})
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {ENGINES.map((e) => (
            <Button
              key={e.id}
              type="button"
              size="sm"
              variant={engine === e.id ? "default" : "ghost"}
              onClick={() => setEngine(e.id)}
              className="font-mono text-xs"
            >
              {e.label}
            </Button>
          ))}
        </div>

        <TestSheet value={value} />
      </div>

      {engine === "bwip" ? (
        <BwipGenerator value={value} />
      ) : (
        <StyledQrGenerator value={value} />
      )}
    </section>
  );
}
