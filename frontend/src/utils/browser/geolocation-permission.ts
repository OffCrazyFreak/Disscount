/** False when unsure: some Safari versions have no Permissions API, reject the name, or report "prompt" for a granted permission. */
export async function isGeolocationGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });

    return status?.state === "granted";
  } catch {
    return false;
  }
}
