import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";

const SYNC_ID = "store-locations";

/**
 * Takes the sync lease when the last run finished over a day ago, or when a
 * run started over two hours ago and never finished (its process died). One
 * conditional upsert, so two app instances cannot both win.
 */
export async function acquireSyncLease(): Promise<boolean> {
  const result = await db.execute(sql`
    insert into store_location_sync (id, started_at, finished_at)
    values (${SYNC_ID}, now(), null)
    on conflict (id) do update
      set started_at = now(), last_error = null
      where store_location_sync.started_at < now() - interval '2 hours'
         or (store_location_sync.finished_at >= store_location_sync.started_at
             and store_location_sync.finished_at < now() - interval '24 hours')
    returning id
  `);

  return result.rows.length > 0;
}

export async function releaseSyncLease(error: string | null): Promise<void> {
  await db.execute(sql`
    update store_location_sync
    set finished_at = now(), last_error = ${error}
    where id = ${SYNC_ID}
  `);
}

/** Cheap read used to decide whether a request should start a sync at all. */
export async function isSyncDue(): Promise<boolean> {
  const result = await db.execute(sql`
    select 1 from store_location_sync
    where id = ${SYNC_ID}
      and (started_at > now() - interval '2 hours'
           and (finished_at is null or finished_at < started_at)
        or finished_at > now() - interval '24 hours')
  `);

  return result.rows.length === 0;
}
