-- Saved places, pinned stores and favourite stores keep the order the user picked them in (#743).
-- Until now a list came back in whatever order PostgreSQL scanned it, and the first saved place sets the distance origin.
-- DEFAULT 0 lets an older backend image still insert rows during a deploy (expand first, owner 2026-11-01).
ALTER TABLE app.pinned_place ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE app.pinned_store ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE app.favorite_store ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- No save ever stored an order, so disk order is the best record: a save inserts its rows in list order,
-- and a delete frees no space before its own commit. A later vacuum may have let a save reuse freed slots.
UPDATE app.pinned_place AS target
SET sort_order = ranked.list_index
FROM (
    SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY ctid) - 1 AS list_index
    FROM app.pinned_place
) AS ranked
WHERE target.id = ranked.id;

UPDATE app.pinned_store AS target
SET sort_order = ranked.list_index
FROM (
    SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY ctid) - 1 AS list_index
    FROM app.pinned_store
) AS ranked
WHERE target.id = ranked.id;

UPDATE app.favorite_store AS target
SET sort_order = ranked.list_index
FROM (
    SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY ctid) - 1 AS list_index
    FROM app.favorite_store
) AS ranked
WHERE target.id = ranked.id;
