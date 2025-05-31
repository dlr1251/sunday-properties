"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/ui/sidebar";

interface SidebarWithLogoutProps extends React.ComponentProps<typeof Sidebar> {}

export function SidebarWithLogout(props: SidebarWithLogoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return <AppSidebar handleLogout={handleLogout} {...props} />;
} 