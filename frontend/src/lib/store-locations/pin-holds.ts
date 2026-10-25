import { storeKey } from "@/lib/store-locations/upstream-stores";

/**
 * Stores whose pin failed or was doubtful in independent verification and
 * that no OpenStreetMap point can fix. Their pin stays hidden and the sync
 * leaves them alone until a person confirms the place in issue #261; then
 * the entry moves to a pin override or is deleted.
 */
export const PIN_HOLDS = new Set<string>([
  // ntl.hr's own coordinates for these are wrong or doubtful.
  storeKey("ntl", "10104"),
  storeKey("ntl", "10108"),
  storeKey("ntl", "20210"),
  storeKey("ntl", "20212"),
  storeKey("ntl", "20218"),
  storeKey("ntl", "20249"),
  storeKey("ntl", "20317"),
  storeKey("ntl", "20322"),
  storeKey("ntl", "20325"),
  storeKey("ntl", "20339"),
  storeKey("ntl", "20342"),
  storeKey("ntl", "20350"),
  storeKey("ntl", "20353"),
  storeKey("ntl", "20374"),
  storeKey("ntl", "20502"),
  storeKey("ntl", "20506"),
  storeKey("ntl", "20507"),
  storeKey("ntl", "20538"),
  storeKey("ntl", "20566"),
  storeKey("ntl", "20574"),
  storeKey("ntl", "20577"),
  storeKey("ntl", "20584"),
  storeKey("ntl", "20586"),
  storeKey("ntl", "20587"),
  storeKey("ntl", "20590"),
  storeKey("ntl", "20606"),
  storeKey("ntl", "20641"),
  storeKey("ntl", "20674"),
  storeKey("ntl", "20706"),
  storeKey("ntl", "20710"),
  storeKey("ntl", "32046"),
  storeKey("ntl", "34026"),
  // The address register's point is off, and the store's own place is unconfirmed.
  storeKey("ntl", "20681"),
  storeKey("ntl", "33119"),
  storeKey("gavranovic", "405"),
  storeKey("ntl", "33061"),
  // Vir: permanently closed on Google; another shop trades at the address.
  storeKey("gavranovic", "474"),
  // diskont.hr's point is 120 m off, on vacant ground.
  storeKey("stanic", "863"),
  // Novska: the geocoded point and the chain's listing disagree.
  storeKey("stridon", "Prod.47"),
  // Dolac: permanently closed on Google; the chain's own store list is stale.
  storeKey("zabac", "PJ-6"),
]);
