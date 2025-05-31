'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SidebarWithLogout } from "@/components/SidebarWithLogout";
import { Toaster } from '@/components/ui/sonner';
// Assuming you have a LoginForm component, otherwise we can create a simple one
// import LoginForm from '@/components/LoginForm'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        // If no user, redirect to login, or you can show a login form directly
        router.push('/login');
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (!user) {
    // This part might not be reached if redirect happens quickly
    // return <LoginForm />; // Or redirect again, or show a message
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="flex h-screen">
      <SidebarWithLogout />
      <main className="flex-1 overflow-y-auto md:mx-auto">
        {children}
      </main>
      <Toaster />
    </div>
  );
}