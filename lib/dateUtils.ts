/**
 * 日期计算和格式化工具
 */

export interface DateInfo {
  isOverdue: boolean
  daysUntilDue: number | null
  label: string
  emoji: string
}

/**
 * 计算日期信息
 */
export function calculateDateInfo(dueDate?: string): DateInfo {
  if (!dueDate) {
    return {
      isOverdue: false,
      daysUntilDue: null,
      label: "",
      emoji: "",
    }
  }

  const dueDateObj = new Date(dueDate)
  const today = new Date()

  // 移除时间部分进行比较
  today.setHours(0, 0, 0, 0)
  dueDateObj.setHours(0, 0, 0, 0)

  const isOverdue = dueDateObj < today
  const daysUntilDue = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let label = ""
  let emoji = ""

  if (isOverdue) {
    label = "已逾期"
    emoji = "❌"
  } else if (daysUntilDue === 0) {
    label = "今天"
    emoji = "🟠"
  } else if (daysUntilDue === 1) {
    label = "明天"
    emoji = "🟡"
  } else if (daysUntilDue > 0) {
    label = `${daysUntilDue}天`
    emoji = "📅"
  }

  return {
    isOverdue,
    daysUntilDue,
    label,
    emoji,
  }
}

/**
 * 获取日期显示文本
 */
export function getDateDisplay(dueDate?: string): string {
  const { label, emoji } = calculateDateInfo(dueDate)
  return label ? `${emoji} ${label}` : ""
}
