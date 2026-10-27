"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Marker, useMap } from "react-map-gl/maplibre";

import { Badge } from "@/components/ui/badge";
import { useFavoriteStores } from "@/app/[locale]/map/hooks/use-favorite-stores";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { STORE_SOURCE_ID } from "@/app/[locale]/map/utils/store-layers";

interface IFavoriteStoreMarkersProps {
  stores: IListedStore[];
}

/**
 * A star on the top-left corner of each favourite pin, opposite the count
 * badge. Decorative: the list names favourites in its own group. A favourite
 * inside a stack gets no star, since the stack is drawn somewhere else.
 */
export default function FavoriteStoreMarkers({
  stores,
}: IFavoriteStoreMarkersProps) {
  const { isFavorite } = useFavoriteStores();
  const unstacked = useUnstackedKeys();

  return stores
    .filter((row) => isFavorite(row.key) && unstacked.includes(row.key))
    .map(({ key, store }) =>
      store.lat == null || store.lon == null ? null : (
        <Marker
          key={key}
          longitude={store.lon}
          latitude={store.lat}
          anchor="right"
          offset={[-9, -16]}
          style={{ pointerEvents: "none" }}
        >
          <Badge size="count" ring aria-hidden className="bg-amber-400 px-0">
            <Star className="size-3 fill-white text-white" />
          </Badge>
        </Marker>
      ),
    );
}

/** Keys of the stores drawn as their own pin, re-read as stacks change. */
function useUnstackedKeys() {
  const { current: map } = useMap();
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!map) return;

    const mapRef = map.getMap();
    let shown = "";

    function update() {
      const next = mapRef.getSource(STORE_SOURCE_ID)
        ? mapRef
            .querySourceFeatures(STORE_SOURCE_ID)
            .filter((feature) => feature.properties.cluster_id == null)
            .map((feature) => String(feature.properties.key))
            .sort()
        : [];
      const joined = next.join();

      if (joined !== shown) {
        shown = joined;
        setKeys(next);
      }
    }

    mapRef.on("render", update);
    return () => {
      mapRef.off("render", update);
    };
  }, [map]);

  return keys;
}
