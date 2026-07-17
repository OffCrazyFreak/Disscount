"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SYMBOLOGIES } from "./symbologies";

interface ISheetEntry {
  label: string;
  text: string;
  dataUrl: string;
  usedSample: boolean;
}

async function buildEntries(value: string): Promise<ISheetEntry[]> {
  const bwipjs = (await import("bwip-js/browser")).default;
  const entries: ISheetEntry[] = [];

  for (const symbology of SYMBOLOGIES) {
    const canvas = document.createElement("canvas");
    const base = {
      bcid: symbology.bcid,
      scale: 2,
      ...(symbology.is2d ? {} : { height: 12, includetext: true }),
    };

    try {
      bwipjs.toCanvas(canvas, { ...base, text: value });
      entries.push({
        label: symbology.label,
        text: value,
        dataUrl: canvas.toDataURL(),
        usedSample: false,
      });
    } catch {
      try {
        bwipjs.toCanvas(canvas, { ...base, text: symbology.sample });
        entries.push({
          label: symbology.label,
          text: symbology.sample,
          dataUrl: canvas.toDataURL(),
          usedSample: true,
        });
      } catch {}
    }
  }

  return entries;
}

function sheetHtml(entries: ISheetEntry[]): string {
  const cells = entries
    .map(
      (e) => `<figure>
        <img src="${e.dataUrl}" alt="${e.label}" />
        <figcaption><strong>${e.label}</strong> ${e.usedSample ? "(sample value)" : ""}<br/><code>${e.text}</code></figcaption>
      </figure>`,
    )
    .join("");

  return `<!doctype html><html><head><title>Code Lab test sheet</title><style>
    body { font-family: monospace; margin: 24px; }
    main { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    figure { margin: 0; text-align: center; break-inside: avoid; }
    img { max-width: 100%; }
    figcaption { font-size: 12px; margin-top: 6px; }
  </style></head><body><h1>Code Lab test sheet</h1><main>${cells}</main></body></html>`;
}

interface ITestSheetProps {
  value: string;
}

export default function TestSheet({ value }: ITestSheetProps) {
  const [busy, setBusy] = useState(false);

  async function handlePrint() {
    setBusy(true);

    try {
      const entries = await buildEntries(value);
      const win = window.open("", "_blank");
      if (!win) return;

      win.document.write(sheetHtml(entries));
      win.document.close();
      win.focus();
      window.setTimeout(() => win.print(), 400);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handlePrint} disabled={busy}>
      <Printer /> Test sheet
    </Button>
  );
}
