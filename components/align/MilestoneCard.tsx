import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DateBadge } from "./DateBadge"
import { priorityBadge } from "@/lib/toolsConfig"

interface Milestone {
  id: string
  title: string
  progress: number
  dueDate?: string
  priority: string
  target: string | null
}

interface MilestoneCardProps {
  milestone: Milestone
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  return (
    <div className="rounded border border-border/50 p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{milestone.title}</p>
        </div>
        <Badge
          className={cn(
            "text-xs flex-shrink-0 whitespace-nowrap",
            priorityBadge[milestone.priority]?.className || "bg-gray-100 text-gray-800"
          )}
        >
          {priorityBadge[milestone.priority]?.label || "未知"}
        </Badge>
      </div>

      {/* 进度条 */}
      <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full",
            milestone.progress >= 90
              ? "bg-green-600"
              : milestone.progress >= 60
                ? "bg-blue-600"
                : "bg-gray-600"
          )}
          style={{ width: `${milestone.progress}%` }}
        />
      </div>

      {/* 进度和日期 */}
      <div className="mt-1 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{milestone.progress}%</p>
        <DateBadge dueDate={milestone.dueDate} compact />
      </div>
    </div>
  )
}
