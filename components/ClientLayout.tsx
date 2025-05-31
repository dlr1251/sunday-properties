'use client';

import { useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar";

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen">
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <AppSidebar />
      </div>
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-[16rem]' : 'md:ml-0'}`}>
        {children}
      </main>
    </div>
  );
} 