"use client";

import { Star } from "lucide-react";
import { Marker } from "react-map-gl/maplibre";

import { Badge } from "@/components/ui/badge";
import { useFavoriteStores } from "@/app/[locale]/map/hooks/use-favorite-stores";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

interface IFavoriteStoreMarkersProps {
  stores: IListedStore[];
}

/**
 * A star on the top-left corner of each favourite pin, opposite the count
 * badge. Decorative: the list names favourites in its own group.
 */
export default function FavoriteStoreMarkers({
  stores,
}: IFavoriteStoreMarkersProps) {
  const { isFavorite } = useFavoriteStores();

  return stores
    .filter((row) => isFavorite(row.key))
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
