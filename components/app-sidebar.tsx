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
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  handleLogout: () => Promise<void>;
}

export function AppSidebar({ handleLogout, ...props }: AppSidebarProps) {
  const pathname = usePathname();
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

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>          
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
              isActive={pathname === '/'}
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Sunday Properties</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {user ? (
        <>
          <SidebarMenu>          
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/search')}>
                <Link href="/search">
                  <IconSearch className="mr-2" />
                  Search 
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/my-favs')}>
                <Link href="/my-favs">
                  <IconHeart className="mr-2" />
                  Favs
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/my-visits')}>
                <Link href="/my-visits">
                  <IconFolder className="mr-2" />
                  My Visits
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/negotiations')}>
                <Link href="/my-deals">
                  <IconChartBar className="mr-2" />
                  My Deals
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/my-properties')}>
                <Link href="/my-properties">
                  <IconListDetails className="mr-2" />
                  My Properties
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
         
          </SidebarMenu>
          <SidebarContent>
            <NavMain items={data.navMain} />
            <NavDocuments items={data.documents} />
            <NavSecondary items={data.navSecondary} className="mt-auto" />
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={user} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <IconLogout className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleLogout}>
                  <IconLogout className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </>
      ) : (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
              <Link href="/dashboard">
                <IconDashboard className="mr-2" />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
      <div className="flex-1" />
    </Sidebar>
  );
}
