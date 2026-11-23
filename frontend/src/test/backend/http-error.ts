import { AxiosError, AxiosHeaders } from "axios";

/** A failed Axios request. The backend's RFC 9457 Problem Details body goes in `data`. */
export function httpError(status: number, data: unknown = { status }) {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
}
