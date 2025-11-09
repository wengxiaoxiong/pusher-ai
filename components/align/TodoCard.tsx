import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DateBadge } from "./DateBadge"
import { priorityBadge, statusBadge } from "@/lib/toolsConfig"

interface Todo {
  id: string
  title: string
  status: string
  dueDate?: string
  priority: string
  isBlocker: boolean
  lastCommitment: string | null
}

interface TodoCardProps {
  todo: Todo
}

export function TodoCard({ todo }: TodoCardProps) {
  return (
    <div className="rounded border border-border/50 p-2">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-medium truncate flex-1">{todo.title}</p>
        <Badge
          className={cn(
            "text-xs flex-shrink-0 whitespace-nowrap",
            priorityBadge[todo.priority]?.className || "bg-gray-100 text-gray-800"
          )}
        >
          {priorityBadge[todo.priority]?.label || "未知"}
        </Badge>
      </div>

      {/* 状态、阻塞标记、日期 */}
      <div className="flex items-center gap-1 flex-wrap">
        <Badge
          className={cn(
            "text-xs",
            statusBadge[todo.status]?.className || ""
          )}
        >
          {statusBadge[todo.status]?.label || "未知"}
        </Badge>

        {todo.isBlocker && todo.status !== "completed" && (
          <span className="text-xs text-red-500 font-medium">⚠️ 阻塞</span>
        )}

        <DateBadge dueDate={todo.dueDate} compact />
      </div>
    </div>
  )
}
