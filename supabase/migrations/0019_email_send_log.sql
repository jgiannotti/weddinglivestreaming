-- ----------------------------------------------------------------------------
-- 0019 — a send log that only the server can write, for the email limits
--
-- The quote form and the newsletter form each email an address a visitor
-- types in, so each needs a limit that a script cannot get around. The only
-- limiter so far lived in the memory of one server instance.
--
-- Those limits cannot be counted from the leads or subscribers tables. Both
-- still carry an INSERT policy for the public API ("anyone can submit a lead",
-- "anyone can subscribe"), and a row inserted that way can carry any
-- created_at. Thirty-one forged, future-dated leads would make the site
-- believe it was under a permanent flood and stop emailing couples and vendors
-- for good, in silence. A limit that an outsider can trip on purpose is a
-- switch for turning the product off.
--
-- So the events the limits count are recorded here instead: row-level security
-- on, no policies, no grants to API roles. Only the service role (the server)
-- can read or write it. Nothing personal is stored in clear: an email address
-- or a visitor's network address goes in as a keyed hash (the visitor one
-- changes every day), and the app deletes rows more than two days old each
-- time either form is used.
--
-- If this migration has not been applied, the app's limit checks fail open:
-- email goes out exactly as it did before the limits existed.
--
-- Left for later, on purpose: removing the two public INSERT policies. The
-- app does not use them (both routes insert with the service role), but the
-- daily health check's "couple submits a lead" journey does, so it has to be
-- changed in the same step.
-- ----------------------------------------------------------------------------

begin;

create table if not exists public.email_send_log (
  id          bigint generated always as identity primary key,
  kind        text not null,
  subject_key text,
  created_at  timestamptz not null default now()
);

comment on table public.email_send_log is
  'One row per email-triggering event, counted by the send limits in src/lib/send-limits.ts. Service role only. subject_key is a vendor id, or a keyed hash of an email address or of a visitor. See migration 0019.';

create index if not exists email_send_log_kind_time_idx
  on public.email_send_log (kind, created_at desc);
create index if not exists email_send_log_kind_key_time_idx
  on public.email_send_log (kind, subject_key, created_at desc);

alter table public.email_send_log enable row level security;

revoke all on table public.email_send_log from public;
revoke all on table public.email_send_log from anon, authenticated;
grant select, insert, delete on table public.email_send_log to service_role;

commit;

-- Make the REST layer see the new table without waiting for its next reload.
notify pgrst, 'reload schema';
