"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type CameraPermission = "granted" | "denied" | "prompt" | "unknown";

const BADGE_VARIANTS: Record<
  CameraPermission,
  "default" | "destructive" | "outline" | "secondary"
> = {
  granted: "default",
  denied: "destructive",
  prompt: "outline",
  unknown: "secondary",
};

export default function PermissionHelp() {
  const [state, setState] = useState<CameraPermission>("unknown");

  useEffect(() => {
    let status: PermissionStatus | null = null;

    async function query() {
      try {
        status = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        setState(status.state);
        status.onchange = () => setState(status?.state ?? "unknown");
      } catch {
        setState("unknown");
      }
    }

    query();

    return () => {
      if (status) status.onchange = null;
    };
  }, []);

  return (
    <Collapsible className="rounded-xl border px-4 py-3">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2">
          Camera permission
          <Badge variant={BADGE_VARIANTS[state]} className="font-mono text-xs">
            {state}
          </Badge>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2 pt-3 text-sm text-muted-foreground">
        <p>
          Browsers do not let a page reset its own camera permission or a stuck
          camera choice. If scanning is blocked or the wrong lens is remembered:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Android Chrome:</strong> tap the icon left of the address
            bar, then Permissions, then Camera, then Reset or Allow.
          </li>
          <li>
            <strong>iOS Safari:</strong> Settings app, then Apps, then Safari,
            then Camera, or the aA / puzzle icon in the address bar for
            per-site settings.
          </li>
          <li>
            <strong>Desktop:</strong> click the camera icon in the address bar
            and switch the allowed device, then reload.
          </li>
          <li>
            The Reset button next to the camera picker only clears the camera
            this page remembered, which fixes most wrong-lens cases without
            touching browser settings.
          </li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
