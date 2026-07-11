-- ----------------------------------------------------------------------------
-- 0011 — welcome email tracking
--
-- New accounts (Google OAuth and email/password) get a one-time welcome email
-- sent via Resend. This column is the send guard: the app atomically claims
-- the send with UPDATE ... WHERE welcome_sent_at IS NULL, so the email can
-- never double-send even if two requests race.
--
-- Backfilled to now() for existing accounts so nobody who signed up before
-- this feature suddenly gets a "welcome" email months later.
-- ----------------------------------------------------------------------------

begin;

alter table public.profiles
  add column if not exists welcome_sent_at timestamptz;

-- Existing users should never receive the welcome email retroactively.
update public.profiles
set welcome_sent_at = now()
where welcome_sent_at is null;

commit;
