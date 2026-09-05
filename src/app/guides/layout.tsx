import type { ReactNode } from 'react';
import { PublisherNote } from '@/components/publisher-note';

// Every guide (and the hub) ends with the same publisher/reviewer note so the
// "who wrote this and why should I trust it" signal is present site-wide
// without touching 17+ page files.
export default function GuidesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PublisherNote />
    </>
  );
}
