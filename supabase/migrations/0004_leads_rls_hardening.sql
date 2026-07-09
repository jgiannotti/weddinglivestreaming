-- ============================================================================
-- Harden public "leads" insert policy — the original policy (0003) allowed
-- `with check (true)`, which meant anyone with the public anon key could POST
-- directly to Supabase's REST API and set matched_vendor_ids / status to
-- arbitrary values, bypassing the app's actual matching logic in
-- src/lib/data/leads.ts. Restrict the forgeable columns at insert time.
-- ============================================================================

drop policy "anyone can submit a lead" on public.leads;

create policy "anyone can submit a lead"
  on public.leads for insert
  with check (matched_vendor_ids = '{}' and status = 'new');
