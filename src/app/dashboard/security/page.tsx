import type { Metadata } from 'next';
import { TwoFactorManager } from './two-factor-manager';

export const metadata: Metadata = { title: 'Security' };
export const dynamic = 'force-dynamic';

export default function SecurityPage() {
  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">Security</h1>
      <p className="text-muted-foreground mb-8">
        Add a second layer of protection to your account with an authenticator app.
      </p>
      <TwoFactorManager />
    </div>
  );
}
