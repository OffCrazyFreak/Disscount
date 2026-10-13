import "server-only";

import { IStoreLocator } from "@/lib/store-locations/types";
import { bosoLocator } from "@/lib/store-locations/sources/boso-locator";
import { brankaLocator } from "@/lib/store-locations/sources/branka-locator";
import { eurospinLocator } from "@/lib/store-locations/sources/eurospin-locator";
import { kauflandLocator } from "@/lib/store-locations/sources/kaufland-locator";
import { konzumLocator } from "@/lib/store-locations/sources/konzum-locator";
import { ktcLocator } from "@/lib/store-locations/sources/ktc-locator";
import { ntlLocator } from "@/lib/store-locations/sources/ntl-locator";
import { plodineLocator } from "@/lib/store-locations/sources/plodine-locator";
import { ribolaLocator } from "@/lib/store-locations/sources/ribola-locator";
import { rotoLocator } from "@/lib/store-locations/sources/roto-locator";
import { sparLocator } from "@/lib/store-locations/sources/spar-locator";
import { tommyLocator } from "@/lib/store-locations/sources/tommy-locator";
import { trgocentarLocator } from "@/lib/store-locations/sources/trgocentar-locator";
import { trgovinaKrkLocator } from "@/lib/store-locations/sources/trgovina-krk-locator";

// Studenac, Stanić, dm, Žabac, Stridon, Gavranović and Metro publish no usable
// coordinates (or no per-store upstream data to match), so the DGU register
// and the geocoders place them instead.
export const storeLocators: IStoreLocator[] = [
  bosoLocator,
  brankaLocator,
  eurospinLocator,
  kauflandLocator,
  konzumLocator,
  ktcLocator,
  ntlLocator,
  plodineLocator,
  ribolaLocator,
  rotoLocator,
  sparLocator,
  tommyLocator,
  trgocentarLocator,
  trgovinaKrkLocator,
];
