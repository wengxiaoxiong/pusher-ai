import { NextResponse } from "next/server"
import { z } from "zod"

type TodoStatus = "pending" | "in_progress" | "completed"

type Inquiry = {
  question: string
  context: string
  priority: number
}

const inquiryRequestSchema = z.object({
  todos: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        status: z.enum(["pending", "in_progress", "completed"]),
        dueDate: z.string().optional(),
        isBlocker: z.boolean().optional(),
        lastCommitment: z.string().optional(),
      }),
    )
    .default([]),
  milestones: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        progress: z.number().min(0).max(100),
        dueDate: z.string().optional(),
        target: z.string().optional(),
      }),
    )
    .default([]),
  memos: z
    .array(
      z.object({
        id: z.string(),
        key: z.string(),
        content: z.string(),
        category: z.string().optional(),
        lastReviewedAt: z.string().optional(),
      }),
    )
    .default([]),
  signals: z
    .object({
      risks: z.array(z.string()).default([]),
      context_changes: z.array(z.string()).default([]),
    })
    .default({ risks: [], context_changes: [] }),
  lastAlignAt: z.string().optional(),
})

type InquiryRequest = z.infer<typeof inquiryRequestSchema>

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as InquiryRequest
    const payload = inquiryRequestSchema.parse(json)

    const inquiries = buildInquiries(payload)
    return NextResponse.json({ inquiries })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors.at(0)?.message ?? "请求无效" }, { status: 400 })
    }
    console.error("inquiry api error", error)
    return NextResponse.json({ error: "追问生成失败，请稍后再试" }, { status: 500 })
  }
}

function buildInquiries({ todos, milestones, memos, signals, lastAlignAt }: InquiryRequest): Inquiry[] {
  const result: Inquiry[] = []
  const now = new Date()
  const lastAlign = lastAlignAt ? new Date(lastAlignAt) : undefined

  const overdueTodos = todos.filter((todo) => isOverdue(todo.dueDate, now) && todo.status !== "completed")
  const blockerTodos = todos.filter((todo) => todo.isBlocker && todo.status !== "completed")

  const riskyMilestones = milestones
    .map((milestone) => ({
      ...milestone,
      daysToDue: milestone.dueDate ? diffInDays(now, new Date(milestone.dueDate)) : undefined,
    }))
    .filter((milestone) => {
      if (milestone.progress >= 100) return false
      if (typeof milestone.daysToDue !== "number") return milestone.progress < 50
      if (milestone.daysToDue <= 3) return milestone.progress < 90
      if (milestone.daysToDue <= 7) return milestone.progress < 70
      return false
    })
    .sort((a, b) => (a.daysToDue ?? Infinity) - (b.daysToDue ?? Infinity))

  for (const todo of [...blockerTodos, ...overdueTodos]) {
    if (result.length >= 3) break
    result.push({
      question: `「${todo.title}」目前进展如何？需要额外支持来解除阻塞吗？`,
      context: todo.lastCommitment ? `上次承诺：${todo.lastCommitment}` : `状态：${mapStatus(todo.status)}`,
      priority: 1,
    })
  }

  for (const milestone of riskyMilestones) {
    if (result.length >= 3) break
    const dueContext = milestone.dueDate
      ? `截止 ${formatDate(milestone.dueDate)} 仅剩 ${milestone.daysToDue} 天`
      : "无明确截止时间"
    result.push({
      question: `里程碑「${milestone.title}」当前进度 ${milestone.progress}% ，按这个节奏能否完成目标？`,
      context: dueContext,
      priority: 1,
    })
  }

  if (result.length < 3 && signals.risks.length) {
    const risk = signals.risks[0]
    result.push({
      question: `关于提到的风险「${risk}」，现在的状况有没有变化？`,
      context: "风险追踪",
      priority: 2,
    })
  }

  if (result.length < 3 && signals.context_changes.length) {
    const change = signals.context_changes[0]
    result.push({
      question: `由于「${change}」导致的变化，需要我们调整计划吗？`,
      context: "上下文变更",
      priority: 2,
    })
  }

  if (result.length < 3 && memos.length) {
    const memo = memos.sort((a, b) => {
      const aDate = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0
      const bDate = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0
      return aDate - bDate
    })[0]

    result.push({
      question: `长记忆「${memo.key}」还保持有效吗？需要更新相关判断吗？`,
      context: memo.category ? `分类：${memo.category}` : "长期记忆复核",
      priority: 3,
    })
  }

  if (result.length < 3 && lastAlign) {
    const hours = Math.floor((now.getTime() - lastAlign.getTime()) / (1000 * 60 * 60))
    if (hours >= 5) {
      result.push({
        question: "距离上次拉齐已经超过 5 小时，有没有新的进展需要同步？",
        context: `上次拉齐：${formatDateTime(lastAlign)}`,
        priority: 3,
      })
    }
  }

  return result.slice(0, 3)
}

function isOverdue(dueDate: string | undefined, now: Date) {
  if (!dueDate) return false
  const due = new Date(dueDate)
  return due < now && !isSameDay(due, now)
}

function diffInDays(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((b.getTime() - a.getTime()) / msPerDay)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatDateTime(value: Date) {
  return `${value.getMonth() + 1}/${value.getDate()} ${value.getHours().toString().padStart(2, "0")}:${value
    .getMinutes()
    .toString()
    .padStart(2, "0")}`
}

function mapStatus(status: TodoStatus) {
  switch (status) {
    case "completed":
      return "已完成"
    case "in_progress":
      return "进行中"
    default:
      return "未开始"
  }
}
