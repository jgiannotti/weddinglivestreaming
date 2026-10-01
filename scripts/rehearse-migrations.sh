#!/usr/bin/env bash
# Replay every migration in supabase/migrations against a throwaway local
# Postgres, with the minimum Supabase scaffolding stubbed in, so a structural
# change can be proven before it touches production.
#
#   sudo scripts/rehearse-migrations.sh            # replay all, leave it running
#   sudo scripts/rehearse-migrations.sh --stop     # shut the cluster down and delete it
#
# Needs a local Postgres 16 (apt package `postgresql-16`), run as root so it can
# drop to the `postgres` user. Nothing here talks to the real database.
#
# After it finishes, connect with:
#   psql -h /var/lib/postgresql/wls_rehearsal -p 54329 -U postgres wls
#
# To act as a signed-in user inside a transaction (how PostgREST runs a request
# carrying a Clerk token):
#   begin;
#   set local role authenticated;
#   select set_config('request.jwt.claims', '{"sub":"<clerk user id>","role":"authenticated"}', true);
#   ... statements under test ...
#   rollback;
# Look identities up as postgres FIRST, then switch role: after the switch RLS
# hides profiles and every lookup comes back empty.

set -euo pipefail

ROOT=/var/lib/postgresql/wls_rehearsal
BIN=/usr/lib/postgresql/16/bin
PORT=54329
HERE="$(cd "$(dirname "$0")/.." && pwd)"

as_pg() { su postgres -s /bin/bash -c "$1"; }
sql()   { psql -q -v ON_ERROR_STOP=1 -h "$ROOT" -p "$PORT" -U postgres "$@"; }

if [[ "${1:-}" == "--stop" ]]; then
  as_pg "$BIN/pg_ctl -D $ROOT/data stop -m fast" >/dev/null 2>&1 || true
  rm -rf "$ROOT"
  echo "rehearsal cluster removed"
  exit 0
fi

as_pg "$BIN/pg_ctl -D $ROOT/data stop -m fast" >/dev/null 2>&1 || true
rm -rf "$ROOT"
install -d -o postgres -g postgres "$ROOT"
as_pg "$BIN/initdb -D $ROOT/data -A trust -U postgres" >/dev/null
as_pg "$BIN/pg_ctl -D $ROOT/data -o \"-p $PORT -k $ROOT -c listen_addresses=''\" -l $ROOT/log -w start" >/dev/null

sql postgres -c "create database wls;"

# --- Supabase scaffolding -------------------------------------------------
sql wls <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create extension if not exists pgcrypto;
create extension if not exists cube;
create extension if not exists earthdistance;

create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
-- Clerk subjects are not uuids, so never let this cast raise.
create function auth.uid() returns uuid language plpgsql stable as $$
begin
  return nullif(auth.jwt() ->> 'sub', '')::uuid;
exception when others then
  return null;
end $$;
create function auth.role() returns text language sql stable as $$
  select coalesce(auth.jwt() ->> 'role', 'anon')
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- Supabase's defaults: new tables, sequences and functions in public are
-- usable by the API roles, and RLS is what actually restricts them. Set
-- BEFORE the replay so the revokes inside individual migrations still win.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
SQL

# --- Replay ---------------------------------------------------------------
for f in "$HERE"/supabase/migrations/*.sql; do
  echo "applying $(basename "$f")"
  sql wls -f "$f" >/dev/null
done

echo "all migrations applied. psql -h $ROOT -p $PORT -U postgres wls"
