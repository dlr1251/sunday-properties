"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconFileText, IconFolder } from '@tabler/icons-react';

interface NavDocumentsProps {
  items: {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function NavDocuments({ items }: NavDocumentsProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 px-4 py-2">
        <IconFolder className="w-5 h-5" />
        <span className="text-sm font-medium">Documents</span>
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon || IconFileText;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                pathname === item.href ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
