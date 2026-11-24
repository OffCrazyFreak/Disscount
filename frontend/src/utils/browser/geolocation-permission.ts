/** False when unsure: some Safari versions lack the API, reject the name, or report "prompt" when granted. */
export async function isGeolocationGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });

    return status?.state === "granted";
  } catch {
    return false;
  }
}
