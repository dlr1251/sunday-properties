"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconUser,
  IconLogout,
  IconCalendar,
  IconHeart,
} from "@tabler/icons-react"
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SimpleSidebar, SimpleSidebarHeader, SimpleSidebarContent, SimpleSidebarFooter } from '@/components/ui/simple-sidebar';

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search Docs",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Documentos",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Contratos",
      url: "#",
      icon: IconReport,
    },
    {
      name: "AI Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

const navLinks = [
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

interface AppSidebarProps {
  handleLogout?: () => void;
}

export function AppSidebar({ handleLogout, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      console.log({data, error});
      if (data?.user) {
        setUser({
          name: data.user.user_metadata?.full_name || data.user.email || '',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || "/avatars/shadcn.jpg",
        });
      } else {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleLogoutClick = async () => {
    if (handleLogout) {
      handleLogout();
    } else {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  return (
    <SimpleSidebar {...props}>
      <SimpleSidebarHeader>
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">Sunday</span>
        </Link>
      </SimpleSidebarHeader>
      <SimpleSidebarContent>
        <nav className="space-y-2">
          <Link 
            href="/search"
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              pathname.startsWith('/search') ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <IconSearch className="w-5 h-5" />
            <span>Search</span>
          </Link>
          <Link 
            href="/my-favs"
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              pathname.startsWith('/my-favs') ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <IconHeart className="w-5 h-5" />
            <span>Favs</span>
          </Link>
          <Link 
            href="/my-visits"
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              pathname.startsWith('/my-visits') ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <IconFolder className="w-5 h-5" />
            <span>My Visits</span>
          </Link>
          <Link 
            href="/my-deals"
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              pathname.startsWith('/negotiations') ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <IconChartBar className="w-5 h-5" />
            <span>My Deals</span>
          </Link>
          <Link 
            href="/my-properties"
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              pathname.startsWith('/my-properties') ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
          >
            <IconListDetails className="w-5 h-5" />
            <span>My Properties</span>
          </Link>
        </nav>
      </SimpleSidebarContent>
      <SimpleSidebarFooter>
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={handleLogoutClick}
        >
          Logout
        </Button>
      </SimpleSidebarFooter>
    </SimpleSidebar>
  );
}
