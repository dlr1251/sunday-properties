'use client';

import { SimpleSidebar } from '@/components/SimpleSidebar';

export default function PropertyLayout({
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
    </div>
  );
} 