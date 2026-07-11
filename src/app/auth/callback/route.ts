import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeIfNeeded } from '@/lib/welcome';

// Auth callback for Google OAuth and email-confirmation links: ?code=xxx
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First-ever sign-in gets a one-time welcome email (guarded by
      // profiles.welcome_sent_at — no-op on every later sign-in).
      if (data.user) await sendWelcomeIfNeeded(data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/sign-in?error=${encodeURIComponent('Could not confirm your email. The link may have expired.')}`
  );
}
