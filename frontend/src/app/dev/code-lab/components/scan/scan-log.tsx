"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IScanEntry } from "./types";

interface IScanLogProps {
  entries: IScanEntry[];
  onClear: () => void;
}

export default function ScanLog({ entries, onClear }: IScanLogProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center font-mono text-xs text-muted-foreground">
        No scans yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Scan log ({entries.length})
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <Trash2 /> Clear
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="font-mono text-xs uppercase">
              <TableHead>Engine</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Format</TableHead>
              <TableHead className="text-right">First decode</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono text-xs">
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.engine}</TableCell>
                <TableCell className="max-w-40 truncate" title={entry.value}>
                  {entry.value}
                </TableCell>
                <TableCell>{entry.format}</TableCell>
                <TableCell className="text-right">
                  {entry.msToFirstDecode !== undefined
                    ? `${entry.msToFirstDecode} ms`
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {new Date(entry.at).toLocaleTimeString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
