"use client"

import { type ReactNode, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { slugify } from "@/lib/slug"
import {
  AlertTriangle,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  NotebookPen,
  RefreshCw,
  Target,
} from "lucide-react"

type TodoStatus = "pending" | "in_progress" | "completed"

type Todo = {
  id: string
  title: string
  status: TodoStatus
  dueDate?: string
  isBlocker?: boolean
  lastCommitment?: string
}

type Milestone = {
  id: string
  title: string
  progress: number
  dueDate?: string
  target?: string
}

type Memo = {
  id: string
  key: string
  content: string
  category?: string
  lastReviewedAt?: string
}

type AlignResult = {
  parsed: {
    achievements: string[]
    blockers: string[]
    decisions: string[]
  }
  updates: {
    completed_todos: string[]
    milestone_progress: { id: string; progress: number }[]
    new_memos: { key: string; content: string; category?: string }[]
  }
  signals: {
    risks: string[]
    context_changes: string[]
  }
  summary: string
}

type Inquiry = {
  question: string
  context: string
  priority: number
}

type SignalsState = AlignResult["signals"]

type InquiryResponse = {
  inquiries: Inquiry[]
}

const defaultAlignText = `今天完成了 PitchLab 第二集脚本，也把数据校验任务搞定。\n广告投放里程碑进度提升到 55%，但剪辑资源仍然卡住，供应商迟迟没有反馈。\n决定明天上午和设计一起评审 demo，并调整直播节奏。\n记得补充现金流 memo：财务预警阈值下调到 3 万。\n团队临时调整了周五例会时间。`

const schedule = [
  { time: "06:00", label: "追问", description: "定期检查", type: "inquiry" },
  { time: "11:00", label: "追问", description: "定期检查", type: "inquiry" },
  { time: "16:00", label: "追问", description: "定期检查", type: "inquiry" },
  { time: "21:00", label: "拉齐", description: "晚间日报", type: "align" },
  { time: "21:30", label: "追问", description: "晚间复盘", type: "inquiry" },
  { time: "02:00", label: "追问", description: "次日守护", type: "inquiry" },
] as const

const statusBadge: Record<TodoStatus, { label: string; className: string }> = {
  pending: { label: "待开始", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "进行中", className: "bg-secondary text-secondary-foreground" },
  completed: { label: "已完成", className: "bg-foreground text-background" },
}

const priorityBadge: Record<number, { label: string; tone: string }> = {
  1: { label: "关键路径", tone: "bg-foreground text-background" },
  2: { label: "风险跟进", tone: "bg-muted text-foreground" },
  3: { label: "周期回顾", tone: "bg-muted text-muted-foreground" },
}

function daysFromNow(days: number) {
  const base = new Date()
  base.setHours(9, 0, 0, 0)
  base.setDate(base.getDate() + days)
  return base.toISOString()
}

const initialTodos: Todo[] = [
  {
    id: slugify("PitchLab 第二集脚本"),
    title: "PitchLab 第二集脚本定稿",
    status: "in_progress",
    dueDate: daysFromNow(1),
    isBlocker: true,
    lastCommitment: "今晚完成修订",
  },
  {
    id: slugify("数据校验任务"),
    title: "数据校验覆盖率提升",
    status: "pending",
    dueDate: daysFromNow(3),
  },
  {
    id: slugify("财务回顾"),
    title: "财务健康线复盘",
    status: "pending",
    dueDate: daysFromNow(5),
  },
]

const initialMilestones: Milestone[] = [
  {
    id: slugify("广告投放"),
    title: "广告投放资产重做",
    progress: 42,
    dueDate: daysFromNow(4),
    target: "目标：周五上线 A/B 测试",
  },
  {
    id: slugify("PitchLab 7 天 3 集"),
    title: "PitchLab 七天三集计划",
    progress: 28,
    dueDate: daysFromNow(6),
    target: "目标：周日交付 3 集",
  },
]

const initialMemos: Memo[] = [
  {
    id: "cashflow-safety",
    key: "cashflow-safety",
    content: "现金流安全阈值维持在 3.5 万，低于需立即提醒",
    category: "goal",
    lastReviewedAt: daysFromNow(-2),
  },
]

export default function Home() {
  const [input, setInput] = useState(defaultAlignText)
  const [alignResult, setAlignResult] = useState<AlignResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [todos, setTodos] = useState(initialTodos)
  const [milestones, setMilestones] = useState(initialMilestones)
  const [memos, setMemos] = useState(initialMemos)
  const [signals, setSignals] = useState<SignalsState>({ risks: [], context_changes: [] })
  const [lastAlignAt, setLastAlignAt] = useState<string | undefined>(undefined)
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [inquiryLoading, setInquiryLoading] = useState(false)
  const [inquiryError, setInquiryError] = useState<string | null>(null)

  const stats = useMemo(() => {
    const completed = todos.filter((todo) => todo.status === "completed").length
    const blockers = todos.filter((todo) => todo.isBlocker && todo.status !== "completed").length
    const avgProgress = milestones.length
      ? Math.round(milestones.reduce((sum, item) => sum + item.progress, 0) / milestones.length)
      : 0
    return { completed, blockers, avgProgress }
  }, [todos, milestones])

  async function handleAlign() {
    if (!input.trim()) {
      setError("请输入需要拉齐的文本")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/align", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      })

      if (!response.ok) {
        const message = await response.json().catch(() => null)
        throw new Error(message?.error ?? "拉齐失败，请稍后再试")
      }

      const data = (await response.json()) as AlignResult
      setAlignResult(data)
      setSignals(data.signals)
      setLastAlignAt(new Date().toISOString())
      setInquiries([])
      setInquiryError(null)

      const completedIds = new Set(data.updates.completed_todos)
      setTodos((prev) =>
        prev.map((todo) => {
          const slug = slugify(todo.title)
          if (completedIds.has(todo.id) || completedIds.has(slug)) {
            return { ...todo, status: "completed", isBlocker: false }
          }
          return todo
        }),
      )

      setMilestones((prev) =>
        prev.map((milestone) => {
          const update = data.updates.milestone_progress.find(
            (item) => item.id === milestone.id || item.id === slugify(milestone.title),
          )
          return update ? { ...milestone, progress: update.progress } : milestone
        }),
      )

      if (data.updates.new_memos.length) {
        setMemos((prev) => {
          const existingKeys = new Set(prev.map((memo) => memo.key))
          const additions = data.updates.new_memos
            .filter((memo) => !existingKeys.has(memo.key))
            .map((memo) => ({
              id: memo.key,
              key: memo.key,
              content: memo.content,
              category: memo.category,
              lastReviewedAt: new Date().toISOString(),
            }))
          return [...prev, ...additions]
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "拉齐失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  async function handleInquiry() {
    setInquiryLoading(true)
    setInquiryError(null)
    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todos, milestones, memos, signals, lastAlignAt }),
      })

      if (!response.ok) {
        const message = await response.json().catch(() => null)
        throw new Error(message?.error ?? "追问生成失败")
      }

      const data = (await response.json()) as InquiryResponse
      setInquiries(data.inquiries)
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : "追问生成失败")
    } finally {
      setInquiryLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-4 rounded-[40px] border border-border/60 bg-card/60 p-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Badge className="bg-foreground text-background" variant="default">
              AiPusher Operating Console
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">拉齐 & 追问双循环</h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              根据 README 的系统设计，将自然语言输入结构化为状态，并驱动追问节奏。黑白配色、流线型卡片和 Hook 驱动的状态管理保证体验一致。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
            <Stat label="成就" value={`${stats.completed}`} icon={<CheckCircle2 className="h-4 w-4" />} />
            <Stat label="阻塞" value={`${stats.blockers}`} icon={<AlertTriangle className="h-4 w-4" />} />
            <Stat label="平均进度" value={`${stats.avgProgress}%`} icon={<Target className="h-4 w-4" />} />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>拉齐输入</CardTitle>
              <CardDescription>输入自然语言日报或事项，系统会解析成就、阻塞、决策与信号。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="记录你的进展、风险与下一步计划..."
                className="min-h-[180px] w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                建议遵循：描述成就 → 阻塞 → 决策 → 长期记忆。系统将自动匹配里程碑与 Todo。
              </p>
              <Button onClick={handleAlign} disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> 正在拉齐
                  </>
                ) : (
                  "执行拉齐"
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>交互节奏</CardTitle>
              <CardDescription>遵循 README 的 5 小时追问节奏与晚间日报。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {schedule.map((item) => (
                  <div key={item.time} className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium",
                          item.type === "align" ? "bg-foreground text-background" : "bg-muted text-foreground",
                        )}
                      >
                        {item.label}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.time}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
                追问在关键路径事件优先触发，其次跟进承诺，最后进行周期性回顾。
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4" /> 拉齐解析结果
              </CardTitle>
              <CardDescription>{alignResult?.summary ?? "等待输入..."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResultSection
                title="成就"
                emptyFallback="暂无成就记录"
                items={alignResult?.parsed.achievements ?? []}
              />
              <ResultSection
                title="阻塞"
                tone="warning"
                emptyFallback="未检测到阻塞"
                items={alignResult?.parsed.blockers ?? []}
              />
              <ResultSection
                title="决策"
                tone="info"
                emptyFallback="没有新的决策"
                items={alignResult?.parsed.decisions ?? []}
              />
              <UpdatesSection updates={alignResult?.updates} todos={todos} milestones={milestones} />
              <SignalsSection signals={signals} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4" /> 追问生成
              </CardTitle>
              <CardDescription>
                根据当前 Todo、里程碑、Memo 与信号生成 1-3 个高价值追问。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inquiryError && <p className="text-sm text-red-500">{inquiryError}</p>}
              <div className="space-y-3">
                {inquiries.length === 0 ? (
                  <EmptyState />
                ) : (
                  inquiries.map((item, index) => (
                    <div key={`${item.priority}-${index}`} className="rounded-2xl border border-border/70 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge className={cn("text-[10px]", priorityBadge[item.priority]?.tone ?? "bg-muted text-foreground")}>
                          {priorityBadge[item.priority]?.label ?? "追问"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">优先级 {item.priority}</span>
                      </div>
                      <p className="text-sm font-medium leading-6">{item.question}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.context}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                每次追问最多 3 条，自动优先关键路径。
              </div>
              <Button onClick={handleInquiry} disabled={inquiryLoading} variant="outline" className="w-full sm:w-auto">
                {inquiryLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> 生成中
                  </>
                ) : (
                  "生成追问"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" /> 关键里程碑
              </CardTitle>
              <CardDescription>按照 README 的时间维度设计追踪进度与预测。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-2xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {milestone.target ?? "未设置目标"}
                      </p>
                    </div>
                    <Badge variant="muted" className="text-xs">
                      {milestone.progress}%
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        milestone.progress >= 90
                          ? "bg-foreground"
                          : milestone.progress >= 60
                            ? "bg-foreground/80"
                            : "bg-foreground/60",
                      )}
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    截止 {milestone.dueDate ? formatDate(milestone.dueDate) : "未设置"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Todo 状态
              </CardTitle>
              <CardDescription>实时更新的任务状态，识别阻塞并驱动追问。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todos.map((todo) => (
                <div key={todo.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{todo.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {todo.dueDate && <span>截止：{formatDate(todo.dueDate)}</span>}
                        {todo.lastCommitment && <span>承诺：{todo.lastCommitment}</span>}
                      </div>
                    </div>
                    <Badge className={cn("text-xs", statusBadge[todo.status].className)}>
                      {statusBadge[todo.status].label}
                    </Badge>
                  </div>
                  {todo.isBlocker && todo.status !== "completed" && (
                    <p className="mt-2 text-xs text-red-500">阻塞：等待资源或决策支持</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ResultSection({
  title,
  items,
  emptyFallback,
  tone = "default",
}: {
  title: string
  items: string[]
  emptyFallback: string
  tone?: "default" | "warning" | "info"
}) {
  const toneClass =
    tone === "warning"
      ? "border-red-200/70 text-red-500"
      : tone === "info"
        ? "border-muted text-muted-foreground"
        : "border-border/60 text-foreground"

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-3 text-xs text-muted-foreground">{emptyFallback}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <p key={`${title}-${index}`} className={cn("rounded-2xl border px-4 py-3 text-sm leading-6", toneClass)}>
              {item}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function UpdatesSection({
  updates,
  todos,
  milestones,
}: {
  updates: AlignResult["updates"] | undefined
  todos: Todo[]
  milestones: Milestone[]
}) {
  if (!updates) return null

  const todoLabel = (id: string) => todos.find((item) => item.id === id || slugify(item.title) === id)?.title ?? id
  const milestoneLabel = (id: string) =>
    milestones.find((item) => item.id === id || slugify(item.title) === id)?.title ?? id

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold tracking-tight">状态更新</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">完成的 Todo</p>
          <ul className="mt-2 space-y-1 text-sm">
            {updates.completed_todos.length ? (
              updates.completed_todos.map((todo) => <li key={todo}>· {todoLabel(todo)}</li>)
            ) : (
              <li className="text-muted-foreground">暂无</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">里程碑进度</p>
          <ul className="mt-2 space-y-1 text-sm">
            {updates.milestone_progress.length ? (
              updates.milestone_progress.map((item) => (
                <li key={item.id}>· {milestoneLabel(item.id)} → {item.progress}%</li>
              ))
            ) : (
              <li className="text-muted-foreground">暂无</li>
            )}
          </ul>
        </div>
      </div>
      {updates.new_memos.length > 0 && (
        <div className="rounded-2xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">新增 Memo</p>
          <ul className="mt-2 space-y-1 text-sm">
            {updates.new_memos.map((memo) => (
              <li key={memo.key}>· {memo.content}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SignalsSection({ signals }: { signals: SignalsState }) {
  const hasSignals = signals.risks.length > 0 || signals.context_changes.length > 0
  if (!hasSignals) {
    return (
      <div className="rounded-2xl border border-dashed px-4 py-3 text-xs text-muted-foreground">
        暂无风险或上下文变化，保持当前节奏。
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {signals.risks.length > 0 && (
        <div className="rounded-2xl border border-red-200/60 bg-red-50/30 p-4 text-sm text-red-600">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" /> 风险信号
          </div>
          <ul className="space-y-1 text-xs">
            {signals.risks.map((item, index) => (
              <li key={`risk-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {signals.context_changes.length > 0 && (
        <div className="rounded-2xl border border-muted p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <RefreshCw className="h-4 w-4" /> 上下文变化
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {signals.context_changes.map((item, index) => (
              <li key={`context-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
      尚未生成追问。执行拉齐后可以根据最新状态生成定向问题。
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:00`
}
