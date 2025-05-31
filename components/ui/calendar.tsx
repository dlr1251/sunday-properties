"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "rounded-lg border border-muted bg-white p-2 shadow-sm w-fit mx-auto text-sm",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-2",
        caption: "flex justify-between items-center px-2 pt-2 pb-1",
        caption_label: "text-base font-semibold text-primary",
        nav: "flex items-center gap-2",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 text-muted-foreground hover:text-primary"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "w-8 h-8 text-center font-medium text-muted-foreground",
        row: "flex w-full",
        cell: "w-8 h-8 text-center p-0 relative",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "w-8 h-8 p-0 rounded-full transition-colors duration-100 aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:shadow-md aria-selected:font-bold aria-selected:ring-2 aria-selected:ring-primary/50 aria-selected:ring-offset-2 aria-selected:ring-offset-background"
        ),
        day_range_end: "",
        day_selected:
          "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        day_today: "border border-primary text-primary font-semibold",
        day_outside:
          "text-muted-foreground opacity-40",
        day_disabled: "text-muted-foreground opacity-30",
        day_range_middle: "bg-accent text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar } 