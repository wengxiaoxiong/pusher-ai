/**
 * AI 工具配置和图标映射
 */

export const toolIcons: Record<string, { icon: string; label: string; color: string }> = {
  "tool-queryTodos": { icon: "📋", label: "查询待办", color: "bg-blue-50" },
  "tool-queryMilestones": { icon: "🎯", label: "查询里程碑", color: "bg-purple-50" },
  "tool-queryMemos": { icon: "🧠", label: "查询备忘", color: "bg-indigo-50" },
  "tool-markTodoComplete": { icon: "✓", label: "标记任务", color: "bg-green-50" },
  "tool-updateMilestoneProgress": { icon: "📊", label: "更新进度", color: "bg-blue-50" },
  "tool-saveMemo": { icon: "📝", label: "保存备忘", color: "bg-yellow-50" },
  "tool-saveInteraction": { icon: "💾", label: "保存交互", color: "bg-pink-50" },
  "tool-addTodo": { icon: "➕", label: "添加任务", color: "bg-green-50" },
  "tool-deleteTodo": { icon: "🗑️", label: "删除任务", color: "bg-red-50" },
  "tool-addMilestone": { icon: "🏁", label: "添加里程碑", color: "bg-purple-50" },
  "tool-deleteMilestone": { icon: "🗑️", label: "删除里程碑", color: "bg-red-50" },
  "tool-deleteMemo": { icon: "🗑️", label: "删除备忘", color: "bg-red-50" },
  "tool-analyzePlanAndSuggestTodos": { icon: "🔍", label: "分析计划", color: "bg-amber-50" },
}

/**
 * 状态徽章配置
 */
export const statusBadge: Record<string, { label: string; className: string }> = {
  pending: { label: "待开始", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "进行中", className: "bg-secondary text-secondary-foreground" },
  completed: { label: "已完成", className: "bg-foreground text-background" },
}

/**
 * 优先级徽章配置
 */
export const priorityBadge: Record<string, { label: string; className: string; emoji: string }> = {
  low: { label: "低", className: "bg-blue-100 text-blue-800", emoji: "🟢" },
  medium: { label: "中", className: "bg-yellow-100 text-yellow-800", emoji: "🟡" },
  high: { label: "高", className: "bg-orange-100 text-orange-800", emoji: "🟠" },
  urgent: { label: "紧急", className: "bg-red-100 text-red-800", emoji: "🔴" },
}
