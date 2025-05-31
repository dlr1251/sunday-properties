'use client';

import { SimpleSidebar } from "@/components/SimpleSidebar";

export default function MyDealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SimpleSidebar />
      <main className="flex-1 md:ml-64 bg-slate-50 dark:bg-slate-900">
        {children}
      </main>
    </div>
  );
} 