/** Prices change about once a day, so an hour old copy is close enough and spares the shared upstream token. */
export const SERVER_LOOKUP_REVALIDATE_SECONDS = 3600;

/** The data cache serves a stale copy while it refreshes, so a cached value carries when upstream actually answered. */
export type FetchedLookup<T> = { data: T; fetchedAt: number };
