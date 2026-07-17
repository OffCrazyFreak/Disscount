import { Metadata } from "next";

import MapClient from "@/app/map/components/map-client";
import { readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Karta i radno vrijeme trgovina",
  description: "Pregled trgovina i njihovog radnog vremena na karti.",
};

export default async function MapPage(props: PageProps<"/map">) {
  const query = readSearchParam(await props.searchParams);

  return <MapClient query={query} />;
}
