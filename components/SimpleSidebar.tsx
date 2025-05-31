'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { IconLogout, IconDashboard, IconSearch, IconListDetails, IconCalendar, IconHeart, IconChartBar } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <IconDashboard className="w-5 h-5 mr-2" />,
  },
  {
    label: "Explore Properties",
    href: "/search",
    icon: <IconSearch className="w-5 h-5 mr-2" />,
  },
  {
    label: "My Estate",
    href: "/my-properties",
    icon: <IconListDetails className="w-5 h-5 mr-2" />,
  },
  {
    label: "My Visits",
    href: "/my-visits",
    icon: <IconCalendar className="w-5 h-5 mr-2" />,
  },
  {
    label: "My Favs",
    href: "/my-favs",
    icon: <IconHeart className="w-5 h-5 mr-2" />,
  },
  {
    label: "My Deals",
    href: "/negotiations",
    icon: <IconChartBar className="w-5 h-5 mr-2" />,
  },
];

export function SimpleSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="font-bold">Sunday Properties</span>
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === link.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <IconLogout className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
} 