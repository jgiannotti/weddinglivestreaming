// Test double for 'resend' (wired in by scripts/e2e/tsconfig.json). Every
// email the app tries to send lands in globalThis.__E2E_SENT__ instead.
//
// A test can make delivery fail for chosen recipients by putting addresses in
// globalThis.__E2E_FAIL_TO__ (a Set), make the provider never answer for
// recipients in globalThis.__E2E_HANG_TO__ (a Set), and simulate one provider
// rate-limit response by setting globalThis.__E2E_RATE_LIMIT_ONCE__ = true.

export interface CapturedEmail {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export class Resend {
  constructor(_key?: string) {}
  emails = {
    send: async (message: CapturedEmail) => {
      const g = globalThis as any;
      if (g.__E2E_RATE_LIMIT_ONCE__) {
        g.__E2E_RATE_LIMIT_ONCE__ = false;
        g.__E2E_RATE_LIMITED__ = (g.__E2E_RATE_LIMITED__ ?? 0) + 1;
        return { data: null, error: { name: 'rate_limit_exceeded', statusCode: 429, message: 'Too many requests' } };
      }
      const failing: Set<string> | undefined = g.__E2E_FAIL_TO__;
      const hanging: Set<string> | undefined = g.__E2E_HANG_TO__;
      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      if (hanging && recipients.some((r) => hanging.has(r))) {
        return new Promise<never>(() => {}); // a request that never comes back
      }
      if (failing && recipients.some((r) => failing.has(r))) {
        return { data: null, error: { name: 'validation_error', statusCode: 422, message: 'Invalid `to` field.' } };
      }
      g.__E2E_SENT__ = g.__E2E_SENT__ ?? [];
      g.__E2E_SENT__.push(message);
      return { data: { id: `e2e_${g.__E2E_SENT__.length}` }, error: null };
    },
  };
}
