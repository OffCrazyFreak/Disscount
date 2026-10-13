import { Suspense } from "react";
import { Metadata } from "next";

import ChainSummary from "@/app/map/components/chain-summary";
import MapClient from "@/app/map/components/map-client";
import { isVisitableStore } from "@/app/map/utils/visitable-store";
import { getStoreDirectory } from "@/lib/store-locations/get-store-directory";

// Reads the database and upstream on request, never at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Karta trgovina",
  description:
    "Pronađi trgovine na karti: Konzum, Lidl, Kaufland, Spar, Plodine, Tommy, Studenac i još 20 lanaca diljem Hrvatske. Pretraži po gradu ili adresi i pronađi najbližu.",
  alternates: { canonical: "/map" },
};

async function loadVisitableStores() {
  try {
    return (await getStoreDirectory()).stores.filter(isVisitableStore);
  } catch {
    // The client loads the same list itself; the overview is a bonus.
    return null;
  }
}

async function ChainSummaryLoader() {
  const stores = await loadVisitableStores();

  return stores ? <ChainSummary stores={stores} /> : null;
}

export default function MapPage() {
  return (
    <>
      <h1 className="sr-only">Karta trgovina</h1>

      <Suspense fallback={null}>
        <MapClient
          chainSummary={
            // Streamed, so the directory fetch never holds up the first byte.
            <Suspense fallback={null}>
              <ChainSummaryLoader />
            </Suspense>
          }
        />
      </Suspense>
    </>
  );
}
