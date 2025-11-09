"use client"

import { RefreshCw, ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { DeleteActions } from "@/components/delete-actions"
import { MilestoneCard } from "./MilestoneCard"
import { TodoCard } from "./TodoCard"
import { MemoCard } from "./MemoCard"

interface Todo {
  id: string
  title: string
  status: string
  dueDate?: string
  priority: string
  isBlocker: boolean
  lastCommitment: string | null
}

interface Milestone {
  id: string
  title: string
  progress: number
  dueDate?: string
  priority: string
  target: string | null
}

interface Memo {
  id: string
  key: string
  content: string
  category: string | null
}

interface DashboardPanelProps {
  todos: Todo[]
  milestones: Milestone[]
  memos: Memo[]
  isLoading: boolean
  loadingDashboard: boolean
  showDeletePanel: boolean
  onRefresh: () => void
  onToggleDeletePanel: () => void
  onDelete: () => void
}

export function DashboardPanel({
  todos,
  milestones,
  memos,
  isLoading,
  loadingDashboard,
  showDeletePanel,
  onRefresh,
  onToggleDeletePanel,
  onDelete,
}: DashboardPanelProps) {
  // 计算统计数据
  const stats = {
    totalTodos: todos.length,
    completedTodos: todos.filter((t) => t.status === "completed").length,
    blockers: todos.filter((t) => t.isBlocker && t.status !== "completed").length,
    avgProgress: milestones.length
      ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length)
      : 0,
  }

  return (
    <div className="lg:col-span-1 flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-4">
        {/* 操作按钮 - 刷新和删除 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loadingDashboard}
          >
            <RefreshCw className={cn("h-4 w-4", loadingDashboard && "animate-spin")} />
          </Button>
          <Button
            variant={showDeletePanel ? "default" : "outline"}
            size="sm"
            onClick={onToggleDeletePanel}
          >
            <ChevronDown className={cn("h-4 w-4", showDeletePanel && "rotate-180")} />
            删除
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">总任务</p>
            <p className="text-lg font-bold">{stats.totalTodos}</p>
          </Card>

          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">已完成</p>
            <p className="text-lg font-bold text-green-600">{stats.completedTodos}</p>
          </Card>

          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">阻塞中</p>
            <p className="text-lg font-bold text-red-600">{stats.blockers}</p>
          </Card>

          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">平均进度</p>
            <p className="text-lg font-bold">{stats.avgProgress}%</p>
          </Card>
        </div>

        {/* 里程碑列表 */}
        {milestones.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold px-1">里程碑</h3>
            <div className="space-y-2">
              {milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          </div>
        )}

        {/* 待办列表 */}
        {todos.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold px-1">待办</h3>
            <div className="space-y-2">
              {todos.map((todo) => (
                <TodoCard key={todo.id} todo={todo} />
              ))}
            </div>
          </div>
        )}

        {/* 备忘录列表 */}
        {memos.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold px-1">记忆</h3>
            <div className="space-y-2">
              {memos.map((memo) => (
                <MemoCard key={memo.id} memo={memo} />
              ))}
            </div>
          </div>
        )}

        {/* 删除面板 */}
        {showDeletePanel && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">删除操作</CardTitle>
              <CardDescription className="text-xs">
                选择要删除的项目
              </CardDescription>
            </CardHeader>
            <CardContent className="py-3">
              <DeleteActions
                todos={todos}
                milestones={milestones}
                memos={memos}
                disabled={isLoading}
                onDelete={onDelete}
              />
            </CardContent>
          </Card>
        )}
        </div>
      </ScrollArea>
    </div>
  )
}
