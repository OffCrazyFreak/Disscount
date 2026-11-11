import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";

export interface ISyncLease {
  id: string;
  every: string;
}

const LOCATION_LEASE: ISyncLease = { id: "store-locations", every: "24 hours" };

/** Taken once the last run is due or a run over 2 hours old died; one upsert, so only one instance can win. */
export async function acquireSyncLease({
  id,
  every,
}: ISyncLease = LOCATION_LEASE): Promise<boolean> {
  const result = await db.execute(sql`
    insert into web.store_location_sync (id, started_at, finished_at)
    values (${id}, now(), null)
    on conflict (id) do update
      set started_at = now()
      where (store_location_sync.started_at < now() - interval '2 hours'
             and (store_location_sync.finished_at is null
                  or store_location_sync.finished_at < store_location_sync.started_at))
         or (store_location_sync.finished_at >= store_location_sync.started_at
             and store_location_sync.finished_at < now() - ${every}::interval)
    returning id
  `);

  return result.rows.length > 0;
}

export async function releaseSyncLease(
  error: string | null,
  { id }: ISyncLease = LOCATION_LEASE,
): Promise<void> {
  await db.execute(sql`
    update web.store_location_sync
    set finished_at = now(), last_error = ${error}
    where id = ${id}
  `);
}

// A rerun in progress keeps the previous answer, because acquiring changes only `started_at`.
export async function hasSyncSucceeded({ id }: ISyncLease): Promise<boolean> {
  const result = await db.execute(sql`
    select 1 from web.store_location_sync
    where id = ${id} and finished_at is not null and last_error is null
  `);

  return result.rows.length > 0;
}

export async function isSyncDue({
  id,
  every,
}: ISyncLease = LOCATION_LEASE): Promise<boolean> {
  const result = await db.execute(sql`
    select 1 from web.store_location_sync
    where id = ${id}
      and (started_at > now() - interval '2 hours'
           and (finished_at is null or finished_at < started_at)
        or finished_at > now() - ${every}::interval)
  `);

  return result.rows.length === 0;
}
