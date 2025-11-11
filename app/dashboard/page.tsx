"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Target, CheckCircle2, Brain } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LogoutButton } from "@/components/auth/logout-button"

type Todo = {
  id: string
  title: string
  status: string
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
}

const statusBadge: Record<string, { label: string; className: string }> = {
  pending: { label: "待开始", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "进行中", className: "bg-secondary text-secondary-foreground" },
  completed: { label: "已完成", className: "bg-foreground text-background" },
}

export default function DashboardPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch("/api/data")
      if (response.ok) {
        const data = await response.json()
        setTodos(data.todos || [])
        setMilestones(data.milestones || [])
        setMemos(data.memos || [])
      }
    } catch (error) {
      console.error("Load data error:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "未设置"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const stats = {
    totalTodos: todos.length,
    completedTodos: todos.filter((t) => t.status === "completed").length,
    blockers: todos.filter((t) => t.isBlocker && t.status !== "completed").length,
    avgProgress: milestones.length
      ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length)
      : 0,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">仪表盘</h1>
              <p className="text-sm text-muted-foreground">查看所有 Todos、里程碑和记忆</p>
            </div>
          </div>
          <LogoutButton variant="outline" size="sm" />
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>总任务</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalTodos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>已完成</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.completedTodos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>阻塞中</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.blockers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>平均进度</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.avgProgress}%</p>
            </CardContent>
          </Card>
        </div>

        {/* 里程碑 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              关键里程碑
            </CardTitle>
            <CardDescription>实时追踪进度</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无里程碑数据</p>
            ) : (
              milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{milestone.title}</p>
                      <p className="text-sm text-muted-foreground">{milestone.target || "未设置目标"}</p>
                    </div>
                    <Badge variant="outline">{milestone.progress}%</Badge>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        milestone.progress >= 90
                          ? "bg-green-600"
                          : milestone.progress >= 60
                            ? "bg-blue-600"
                            : "bg-gray-600"
                      )}
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">截止 {formatDate(milestone.dueDate)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Todos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Todo 列表
            </CardTitle>
            <CardDescription>实时更新的任务状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todos.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无 Todo 数据</p>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{todo.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {todo.dueDate && <span>截止:{formatDate(todo.dueDate)}</span>}
                        {todo.lastCommitment && <span>承诺:{todo.lastCommitment}</span>}
                      </div>
                    </div>
                    <Badge className={cn("text-xs", statusBadge[todo.status]?.className || "")}>
                      {statusBadge[todo.status]?.label || "未知"}
                    </Badge>
                  </div>
                  {todo.isBlocker && todo.status !== "completed" && (
                    <p className="mt-2 text-xs text-red-500">⚠️ 阻塞:等待资源或决策支持</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Memos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              长期记忆
            </CardTitle>
            <CardDescription>重要的信息和决策</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memos.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无 Memo 数据</p>
            ) : (
              memos.map((memo) => (
                <div key={memo.id} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{memo.key}</p>
                      <p className="text-sm text-muted-foreground">{memo.content}</p>
                    </div>
                    {memo.category && <Badge variant="outline">{memo.category}</Badge>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
