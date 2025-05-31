'use client'; // Add use client for useRouter and event handling

import { AppSidebar } from "@/components/app-sidebar"
import { useRouter } from 'next/navigation'; // Import useRouter
import { supabase } from '@/lib/supabase'; // Import supabase client

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Redirect to homepage after logout
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar handleLogout={handleLogout} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 