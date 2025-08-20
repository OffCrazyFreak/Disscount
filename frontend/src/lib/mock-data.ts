// Mock data for stores and locations
export interface Store {
  id: string;
  name: string;
  image: string;
}

export interface Location {
  id: string;
  name: string;
  city: string;
}

export const mockStores: Store[] = [
  { id: "konzum", name: "Konzum", image: "/stores/konzum.png" },
  { id: "lidl", name: "Lidl", image: "/stores/lidl.png" },
  { id: "kaufland", name: "Kaufland", image: "" },
  { id: "spar", name: "Spar", image: "" },
  { id: "tommy", name: "Tommy", image: "" },
  { id: "plodine", name: "Plodine", image: "" },
  { id: "studenac", name: "Studenac", image: "" },
  { id: "dm", name: "DM", image: "" },
];

export const mockLocations: Location[] = [
  { id: "zagreb", name: "Zagreb", city: "Zagreb" },
  { id: "split", name: "Split", city: "Split" },
  { id: "rijeka", name: "Rijeka", city: "Rijeka" },
  { id: "osijek", name: "Osijek", city: "Osijek" },
  { id: "zadar", name: "Zadar", city: "Zadar" },
  { id: "pula", name: "Pula", city: "Pula" },
  { id: "karlovac", name: "Karlovac", city: "Karlovac" },
  { id: "sisak", name: "Sisak", city: "Sisak" },
];
