'use client'; // Add use client for useRouter and event handling

import { SimpleSidebar } from "@/components/SimpleSidebar";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <SimpleSidebar />
      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  )
} 