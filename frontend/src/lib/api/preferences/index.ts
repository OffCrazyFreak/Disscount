import {
  useGetPinnedPlaces,
  useGetPinnedStores,
  useUpdatePinnedPlaces,
  useUpdatePinnedStores,
} from "@/lib/api/preferences/hooks";
import {
  getPinnedPlaces,
  getPinnedStores,
} from "@/lib/api/preferences/queries";

const preferencesService = {
  getPinnedStores,
  getPinnedPlaces,
  useGetPinnedStores,
  useUpdatePinnedStores,
  useGetPinnedPlaces,
  useUpdatePinnedPlaces,
};

export default preferencesService;
