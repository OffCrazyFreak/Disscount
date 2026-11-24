import "server-only";

import { IStoreLocator } from "@/lib/store-locations/store-location-types";
import { bosoLocator } from "@/lib/store-locations/sources/locators/boso-locator";
import { brankaLocator } from "@/lib/store-locations/sources/locators/branka-locator";
import { eurospinLocator } from "@/lib/store-locations/sources/locators/eurospin-locator";
import { kauflandLocator } from "@/lib/store-locations/sources/locators/kaufland-locator";
import { konzumLocator } from "@/lib/store-locations/sources/locators/konzum-locator";
import { ktcLocator } from "@/lib/store-locations/sources/locators/ktc-locator";
import { ntlLocator } from "@/lib/store-locations/sources/locators/ntl-locator";
import { plodineLocator } from "@/lib/store-locations/sources/locators/plodine-locator";
import { ribolaLocator } from "@/lib/store-locations/sources/locators/ribola-locator";
import { rotoLocator } from "@/lib/store-locations/sources/locators/roto-locator";
import { sparLocator } from "@/lib/store-locations/sources/locators/spar-locator";
import { stanicLocator } from "@/lib/store-locations/sources/locators/stanic-locator";
import { tommyLocator } from "@/lib/store-locations/sources/locators/tommy-locator";
import { trgocentarLocator } from "@/lib/store-locations/sources/locators/trgocentar-locator";
import { trgovinaKrkLocator } from "@/lib/store-locations/sources/locators/trgovina-krk-locator";

// These publish no usable coordinates, so the DGU register and geocoders place them.
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
  stanicLocator,
  tommyLocator,
  trgocentarLocator,
  trgovinaKrkLocator,
];
