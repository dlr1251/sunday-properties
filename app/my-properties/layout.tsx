'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from '@/components/ui/sonner';
import { Sidebar } from '@/components/ui/sidebar';

export default function NegotiationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <div className="flex-1 flex flex-col">
        {/* <SiteHeader /> */}
        <main className="flex-1 pt-16">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}