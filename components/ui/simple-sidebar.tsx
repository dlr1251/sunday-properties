"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"

interface SimpleSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  side?: "left" | "right"
}

export function SimpleSidebar({
  children,
  side = "left",
  className,
  ...props
}: SimpleSidebarProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={side}
          className={cn(
            "bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden",
            className
          )}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Mobile navigation menu</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      data-slot="sidebar"
      className={cn(
        "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
        className
      )}
      style={
        {
          "--sidebar-width": SIDEBAR_WIDTH,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}

export function SimpleSidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex h-14 items-center border-b px-4", className)}
      {...props}
    />
  )
}

export function SimpleSidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 overflow-auto p-4", className)}
      {...props}
    />
  )
}

export function SimpleSidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex h-14 items-center border-t px-4", className)}
      {...props}
    />
  )
} 