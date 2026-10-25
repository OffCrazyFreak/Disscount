import { storeKey } from "@/lib/store-locations/upstream-stores";

/**
 * Saved address-register pins that failed verification, with the register's
 * right place that independent verification confirmed within about 30 m of
 * the store. The sync never revisits a saved pin, so the map shows these
 * instead. Each applies only while upstream keeps the address it was checked
 * for; a new address gets a fresh pin from the sync.
 */
export const PIN_CORRECTIONS = new Map<
  string,
  { address: string; lat: number; lon: number }
>([
  [
    storeKey("gavranovic", "338"),
    { address: "Frankopanski trg 6", lat: 44.9903243, lon: 14.9014038 },
  ],
  [
    storeKey("gavranovic", "426"),
    { address: "Prilaz Grge Antunca 2", lat: 45.7966159, lon: 15.9156051 },
  ],
  [
    storeKey("gavranovic", "445"),
    { address: "Gospodska 28", lat: 45.8170395, lon: 15.8869826 },
  ],
  [
    storeKey("konzum", "0680"),
    { address: "Ulica Verudella 11", lat: 44.8366521, lon: 13.8366057 },
  ],
  [
    storeKey("metro", "S10"),
    { address: "Jankomir 31", lat: 45.7998556, lon: 15.8810342 },
  ],
  [
    storeKey("metro", "S15"),
    { address: "Murvica Ik 2", lat: 44.1389958, lon: 15.3138328 },
  ],
  [
    storeKey("ntl", "20247"),
    {
      address: "Kralja Tomislava 1, Veliskovci",
      lat: 45.6987583,
      lon: 18.3236708,
    },
  ],
  [
    storeKey("ntl", "20669"),
    {
      address: "Osjecka ulica 46, Samatovci",
      lat: 45.5917043,
      lon: 18.4995779,
    },
  ],
  [
    storeKey("ntl", "20693"),
    {
      address: "Zrtava Domovinskog rata 25, Secerana",
      lat: 45.7840666,
      lon: 18.5907432,
    },
  ],
  [
    storeKey("ntl", "20695"),
    {
      address: "Dobra ulica 2, Brijest, Osijek",
      lat: 45.5222462,
      lon: 18.6742419,
    },
  ],
  [
    storeKey("ntl", "33067"),
    { address: "Glavna 45, Sivica", lat: 46.4466564, lon: 16.5018028 },
  ],
  [
    storeKey("stridon", "Prod.09"),
    { address: "Trg S.Radića 14", lat: 46.067172, lon: 16.9896406 },
  ],
  [
    storeKey("stridon", "Prod.51"),
    { address: "Vitasovićeva poljana 11", lat: 45.7896818, lon: 15.9508774 },
  ],
  [
    storeKey("zabac", "PJ-VG"),
    { address: "Trg Grada Vukovara 8", lat: 45.714084, lon: 16.0676126 },
  ],
]);
