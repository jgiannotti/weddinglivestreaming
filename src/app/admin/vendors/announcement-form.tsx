'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export function AnnouncementForm() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  function handleSend() {
    if (!message.trim()) return;
    // Stub only — Resend is deliberately not configured yet. No email is
    // sent here; this just simulates the flow so the UI is ready to wire up.
    setStatus('Announcement queued — email sending will activate once Resend is configured.');
    setMessage('');
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold mb-1">Send announcement</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Broadcast a message to every vendor. Email sending is not yet wired up.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Write your announcement..."
        className="w-full rounded-md border bg-background p-3 text-sm mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSend} disabled={!message.trim()}>
          <Send className="h-4 w-4" />
          Send to all vendors
        </Button>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </div>
    </div>
  );
}
