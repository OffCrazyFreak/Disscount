/**
 * Whether the browser already allows geolocation, so asking cannot open a
 * prompt. False when unsure: some Safari versions have no Permissions API,
 * reject the "geolocation" name, or report "prompt" for a granted permission.
 */
export async function isGeolocationGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });

    return status?.state === "granted";
  } catch {
    return false;
  }
}
