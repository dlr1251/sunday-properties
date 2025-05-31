"use client";

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface SidebarWithLogoutProps {
  onToggle?: () => void;
}

export function SidebarWithLogout({ onToggle }: SidebarWithLogoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-full w-[16rem] flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        {onToggle && (
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto py-2">
        {/* Add your sidebar navigation items here */}
      </div>
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
} 