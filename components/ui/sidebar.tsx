"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Sidebar({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  children,
  ...props
}: SidebarProps) {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      if (setOpenProp) {
        setOpenProp(value)
      } else {
        setOpen(value)
      }
    },
    [setOpenProp]
  )

  if (!mounted) {
    return null
  }

  return (
    <div
      className={cn(
        "group/sidebar flex min-h-svh w-full",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-300",
          (!openProp && !open) && "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        {children}
      </div>
      {isMobile && open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => handleOpenChange(false)}
        />
      )}
    </div>
  )
}

export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex h-16 items-center border-b px-6", className)}
      {...props}
    />
  )
}

export function SidebarContent({
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

export function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-t p-4", className)}
      {...props}
    />
  )
}

export function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn("my-4", className)}
      {...props}
    />
  )
}

export function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("md:hidden", className)}
      {...props}
    />
  )
}

export function SidebarMenu({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

export function SidebarMenuItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

export function SidebarMenuButton({
  className,
  isActive = false,
  tooltip,
  asChild = false,
  ...props
}: React.ComponentProps<typeof Button> & {
  isActive?: boolean
  tooltip?: string
  asChild?: boolean
}) {
  const button = (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start",
        isActive && "bg-accent",
        className
      )}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild={asChild}>
          {button}
        </TooltipTrigger>
        <TooltipContent side="right">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function SidebarGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

export function SidebarGroupContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}
