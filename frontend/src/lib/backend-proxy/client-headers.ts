import {
  CLIENT_HEADER,
  CLIENT_HEADER_VALUE,
  USER_HEADER,
} from "@/lib/backend-proxy/proxy-contract";
import { getCacheIdentity } from "@/lib/offline/cache-identity";

/** What every browser call through the backend proxy carries: the CSRF header and the identity pin. */
export function backendProxyHeaders(): Record<string, string> {
  return {
    [CLIENT_HEADER]: CLIENT_HEADER_VALUE,
    [USER_HEADER]: getCacheIdentity(),
  };
}
