import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OfflineRetryButton from "@/app/offline/components/offline-retry-button";

export const metadata: Metadata = {
  title: "Nema veze s internetom",
  description: "Trenutno ste izvan mreže.",
};

export default function OfflinePage() {
  return (
    <div className="m-2 flex items-center justify-center min-h-[70dvh]">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4 text-muted-foreground">
          <CardTitle>
            <div className="text-2xl">Nema veze s internetom 📡</div>
          </CardTitle>

          <CardDescription className="space-y-2">
            <div>
              Trenutno ste izvan mreže. Spremljeni popisi, praćeni proizvodi i
              nedavno pregledani proizvodi i dalje su dostupni.
            </div>

            <div className="text-gray-600">
              Provjerite vezu pa pokušaj ponovno.
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-2 flex items-center justify-center text-center">
          <OfflineRetryButton />
        </CardContent>
      </Card>
    </div>
  );
}
