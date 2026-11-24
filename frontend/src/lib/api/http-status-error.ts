import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";

/** So the retry and error reporting rules read its status exactly as they read one from apiClient. */
export function httpStatusError(message: string, status: number): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response: AxiosResponse = {
    data: undefined,
    status,
    statusText: "",
    headers: {},
    config,
  };
  // The same codes axios gives a failed response, so Sentry groups both alike.
  const code =
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST;

  return new AxiosError(message, code, config, undefined, response);
}
