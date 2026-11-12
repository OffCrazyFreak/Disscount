import {
  CLIENT_HEADER,
  CLIENT_HEADER_VALUE,
  USER_HEADER,
} from "@/lib/backend-proxy/proxy-contract";
import { getCacheIdentity } from "@/lib/offline/cache-identity";

export function backendProxyHeaders(): Record<string, string> {
  return {
    [CLIENT_HEADER]: CLIENT_HEADER_VALUE,
    [USER_HEADER]: getCacheIdentity(),
  };
}
