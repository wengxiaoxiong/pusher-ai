"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type Todo = {
  id: string
  title: string
  status: string
  dueDate?: string
  priority: string
  isBlocker: boolean
  lastCommitment: string | null
}

export type Milestone = {
  id: string
  title: string
  progress: number
  dueDate?: string
  priority: string
  target: string | null
}

export type Memo = {
  id: string
  key: string
  content: string
  category: string | null
}

interface DeleteActionsProps {
  todos: Todo[]
  milestones: Milestone[]
  memos: Memo[]
  onDelete?: (type: "todo" | "milestone" | "memo", name: string) => void
  disabled?: boolean
}

export function DeleteActions({
  todos,
  milestones,
  memos,
  onDelete,
  disabled = false,
}: DeleteActionsProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "todo" | "milestone" | "memo"
    name: string
  } | null>(null)

  const handleDelete = async (type: "todo" | "milestone" | "memo", name: string) => {
    try {
      // 直接调用删除 API
      const response = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onDelete?.(type, name)
        setDeleteConfirm(null)
      } else {
        alert(`删除失败: ${data.message || "未知错误"}`)
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("删除失败，请重试")
    }
  }

  return (
    <div className="space-y-3">
      {/* 删除操作 - Todos */}
      {todos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <Trash2 className="h-3 w-3" />
            删除待办
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-2 rounded border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{todo.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {todo.status === "completed" ? "已完成" : "未完成"}
                    {todo.isBlocker ? " • ⚠️ 阻塞中" : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                  disabled={disabled}
                  onClick={() => setDeleteConfirm({ type: "todo", name: todo.title })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 删除操作 - Milestones */}
      {milestones.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <Trash2 className="h-3 w-3" />
            删除里程碑
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-2 rounded border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{milestone.title}</p>
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
                  <p className="text-xs text-muted-foreground mt-1">{milestone.progress}% 完成</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                  disabled={disabled}
                  onClick={() => setDeleteConfirm({ type: "milestone", name: milestone.title })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 删除操作 - Memos */}
      {memos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1">
            <Trash2 className="h-3 w-3" />
            删除备忘录
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {memos.map((memo) => (
              <div
                key={memo.id}
                className="flex items-center justify-between p-2 rounded border border-border/50 hover:bg-muted/50 transition-colors bg-muted/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{memo.key}</p>
                  <p className="text-xs text-muted-foreground truncate line-clamp-1">{memo.content}</p>
                  {memo.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {memo.category}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                  disabled={disabled}
                  onClick={() => setDeleteConfirm({ type: "memo", name: memo.key })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {todos.length === 0 && milestones.length === 0 && memos.length === 0 && (
        <div className="p-4 rounded border border-dashed border-border text-center">
          <p className="text-xs text-muted-foreground">暂无项目可删除</p>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                确认删除
              </CardTitle>
              <CardDescription>
                这个操作无法撤销，确定要删除吗？
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm font-medium mb-1">
                  {deleteConfirm.type === "todo" && "待办:"}
                  {deleteConfirm.type === "milestone" && "里程碑:"}
                  {deleteConfirm.type === "memo" && "备忘录:"}
                </p>
                <p className="text-sm text-muted-foreground break-words">{deleteConfirm.name}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  取消
                </Button>
                <Button
                  onClick={() =>
                    handleDelete(deleteConfirm.type, deleteConfirm.name)
                  }
                  disabled={disabled}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
