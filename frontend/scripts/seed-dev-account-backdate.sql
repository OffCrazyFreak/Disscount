-- Optional follow-up to seed-dev-account.mjs: spreads the seeded rows over the past six
-- weeks, so the account looks used rather than created a minute ago. The APIs stamp
-- everything "now" and expose no way to set it, hence plain SQL on a dev database.
-- Rerunnable: every offset is relative to now, so a same-day rerun lands on the same days
-- and a later one moves the whole history forward with it.
-- Columns are zone-less UTC (Timestamps.nowUtc), so "now" is taken in UTC as well.
--
-- Usage: psql -v email=<DEV_ACCOUNT_EMAIL> -f seed-dev-account-backdate.sql
-- Never point it at production; it refuses to run there only by convention.
\set ON_ERROR_STOP on
begin;

create temp table seed_user on commit drop as
  select id, (now() at time zone 'utc') as now_utc from "user" where email = :'email';

-- Fails loudly instead of updating nothing when the address is wrong.
select 1 / (select count(*) from seed_user)::int as account_found;

update "user" u set created_at = s.now_utc - interval '42 days'
  from seed_user s where u.id = s.id;
update account a set created_at = s.now_utc - interval '42 days'
  from seed_user s where a.user_id = s.id;
update app_user a set created_at = s.now_utc - interval '42 days',
    onboarding_completed_at = s.now_utc - interval '42 days' + interval '6 minutes',
    last_active_at = s.now_utc - interval '3 hours'
  from seed_user s where a.id = s.id;

-- Lists: oldest first, each list's items added over the hours after it was made.
with ordered as (
  select l.id, row_number() over (order by l.created_at) as n, s.now_utc
  from shopping_list l join seed_user s on l.owner_id = s.id
)
update shopping_list l
  set created_at = o.now_utc - (array[38, 27, 13, 4])[least(o.n, 4)] * interval '1 day',
      updated_at = o.now_utc - (array[2, 9, 6, 1])[least(o.n, 4)] * interval '1 day'
  from ordered o where l.id = o.id;

with ordered as (
  select i.id, l.created_at as list_created,
    row_number() over (partition by l.id order by i.created_at) as n
  from shopping_list_item i join shopping_list l on i.shopping_list_id = l.id
  join seed_user s on l.owner_id = s.id
)
update shopping_list_item i
  set created_at = o.list_created + o.n * interval '17 minutes',
      updated_at = o.list_created + o.n * interval '17 minutes'
        + case when i.is_checked then interval '1 day' else interval '0' end
  from ordered o where i.id = o.id;

-- Watchlist: added over five weeks; every third one has already fired a price alert,
-- and an alert the account really received is left alone.
with ordered as (
  select w.id, row_number() over (order by w.created_at) as n, s.now_utc
  from watchlist_item w join seed_user s on w.user_id = s.id
)
update watchlist_item w
  set created_at = o.now_utc - greatest(40 - o.n * 3, 1) * interval '1 day',
      updated_at = o.now_utc - greatest(40 - o.n * 3, 1) * interval '1 day',
      last_notified_at = case when o.n % 3 = 0
        then o.now_utc - (o.n % 5 + 1) * interval '1 day' else w.last_notified_at end
  from ordered o where w.id = o.id;

with ordered as (
  select c.id, row_number() over (order by c.created_at) as n, s.now_utc
  from wallet_card c join seed_user s on c.user_id = s.id
)
update wallet_card c
  set created_at = o.now_utc - (array[39, 31, 20])[least(o.n, 3)] * interval '1 day',
      updated_at = o.now_utc - (array[39, 31, 20])[least(o.n, 3)] * interval '1 day',
      pinned_at = case when c.pinned_at is not null
        then o.now_utc - interval '37 days' end,
      last_used_at = case when c.last_used_at is not null
        then o.now_utc - (array[2, 6, 15])[least(o.n, 3)] * interval '1 day' end
  from ordered o where c.id = o.id;

update wallet_card_photo p set created_at = c.created_at + interval '2 minutes'
  from wallet_card c join seed_user s on c.user_id = s.id where p.card_id = c.id;

with ordered as (
  select m.id, row_number() over (order by m.created_at) as n, s.now_utc
  from contact_message m join seed_user s on m.user_id = s.id
)
update contact_message m
  set created_at = o.now_utc - (array[25, 9])[least(o.n, 2)] * interval '1 day',
      updated_at = o.now_utc - (array[25, 9])[least(o.n, 2)] * interval '1 day'
  from ordered o where m.id = o.id;

-- Sessions keep their expiry; only when each device first signed in moves back.
with ordered as (
  select x.id, row_number() over (order by x.created_at) as n, s.now_utc
  from session x join seed_user s on x.user_id = s.id
)
update session x
  set created_at = o.now_utc - (array[21, 10, 2])[least(o.n, 3)] * interval '1 day',
      updated_at = o.now_utc - (o.n - 1) * interval '1 day'
  from ordered o where x.id = o.id;

commit;
