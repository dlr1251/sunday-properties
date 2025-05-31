'use client';

import { SimpleSidebar } from '@/components/SimpleSidebar';
import { Toaster } from '@/components/ui/sonner';

export default function NegotiationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SimpleSidebar />
      <main className="flex-1 md:ml-64">
        {children}
      </main>
      <Toaster />
    </div>
  );
}