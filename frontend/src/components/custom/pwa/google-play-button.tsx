import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLAY_STORE_URL } from "@/constants/android";

// Shown next to the install CTA on Android, where the Play build is the nicer option.
export default function GooglePlayButton() {
  return (
    <Button asChild size="sm" variant="outline" className="w-full">
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
        <Download className="size-4" />
        Preuzmi s Google Playa
      </a>
    </Button>
  );
}
