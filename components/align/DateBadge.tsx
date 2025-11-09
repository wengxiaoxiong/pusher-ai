import { cn } from "@/lib/utils"
import { calculateDateInfo } from "@/lib/dateUtils"

interface DateBadgeProps {
  dueDate?: string
  className?: string
  compact?: boolean
}

export function DateBadge({ dueDate, className, compact = false }: DateBadgeProps) {
  const dateInfo = calculateDateInfo(dueDate)

  if (!dateInfo.label) {
    return null
  }

  if (compact) {
    return (
      <span className={cn("text-xs", dateInfo.isOverdue ? "text-red-600 font-medium" : "text-muted-foreground", className)}>
        {dateInfo.emoji} {dateInfo.label}
      </span>
    )
  }

  return (
    <span className={cn("text-xs", dateInfo.isOverdue ? "text-red-600 font-medium" : "text-muted-foreground", className)}>
      {dateInfo.emoji} {dateInfo.label}
    </span>
  )
}
