'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MyDealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar handleLogout={handleLogout} />
      <main className="flex-1 bg-slate-50 dark:bg-slate-900">
        {children}
      </main>
    </div>
  );
} 