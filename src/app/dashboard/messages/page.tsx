import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { Mail, MailOpen } from 'lucide-react';
import { ensureProfile } from '@/lib/auth';

export default async function MessagesPage() {
  const supabase = await createClient();
  // Clerk session -> public.profiles row. profiles.id is the same uuid the
  // old Supabase auth user carried, so every `user.id` below is unchanged.
  const user = await ensureProfile();
  if (!user) return null;

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!vendor) {
    return <p className="text-muted-foreground">You don&rsquo;t have a vendor profile yet.</p>;
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id, subject, body, sender_email, sender_name, sender_phone, read_at, created_at, listing_id')
    .eq('to_vendor_id', vendor.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Inquiries</h1>
      <p className="text-muted-foreground mb-8">Messages from couples interested in your services.</p>

      {(!messages || messages.length === 0) ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
          No inquiries yet. They&rsquo;ll show up here as couples reach out.
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {m.read_at ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}
                    <span className="font-semibold">{m.sender_name || m.sender_email}</span>
                    {!m.read_at && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">New</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {m.sender_email}
                    {m.sender_phone && <> · {m.sender_phone}</>}
                    <> · {formatDate(m.created_at)}</>
                  </p>
                </div>
              </div>
              {m.subject && <p className="font-medium mb-2">{m.subject}</p>}
              <p className="text-sm whitespace-pre-line text-foreground/80">{m.body}</p>
              <div className="mt-4 flex gap-2">
                <a
                  href={`mailto:${m.sender_email}?subject=Re: ${encodeURIComponent(m.subject || 'Your wedding livestream inquiry')}`}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Reply via email →
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
