// Workbox Background Sync's default retention (MAX_RETENTION_TIME): a change that has not
// reached the server in a week likely no longer says what the user wants.
export const QUEUED_WRITE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function isQueuedWriteExpired(queuedAt: number, now = Date.now()) {
  return now - queuedAt > QUEUED_WRITE_MAX_AGE_MS;
}
