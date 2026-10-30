import { isAxiosError } from "axios";

/** True when no HTTP answer came back at all, i.e. the device is offline or the host unreachable. */
export function isNetworkFailure(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}
