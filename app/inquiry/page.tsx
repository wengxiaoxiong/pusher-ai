"use client"

import { useEffect, useState } from "react"
import { useCompletion } from "@ai-sdk/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"

type Inquiry = {
  question: string
  context: string
  priority: number
}

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

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: { label: "关键路径", className: "bg-foreground text-background" },
  2: { label: "风险跟进", className: "bg-muted text-foreground" },
  3: { label: "周期回顾", className: "bg-muted text-muted-foreground" },
}

export default function InquiryPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [memos, setMemos] = useState<Memo[]>([])

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
    }
  }

  const { completion, complete, isLoading, error, setCompletion } = useCompletion({
    api: "/api/inquiry",
    body: {
      todos,
      milestones,
      memos,
      signals: { risks: [], context_changes: [] },
      lastAlignAt: new Date().toISOString(),
    },
    onFinish: async (_prompt, completion) => {
      try {
        const parsed = JSON.parse(completion.trim()) as Inquiry[]
        setInquiries(parsed)
        setCompletion("")
      } catch (error) {
        console.error("Parse inquiry error:", error)
        alert("追问返回格式错误")
      }
    },
  })

  const handleGenerate = async () => {
    setCompletion("")
    setInquiries([])
    await complete("")
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* 头部 */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">追问</h1>
            <p className="text-sm text-muted-foreground">保持节奏,高效反思</p>
          </div>
        </div>

        {/* 说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI 追问
            </CardTitle>
            <CardDescription>
              根据你的 Todos、里程碑和记忆,AI 会生成 1-3 个高价值问题,帮助你保持节奏
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-500">追问失败: {error.message}</p>}
            {isLoading && completion && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border/60 bg-muted p-3">
                <p className="text-xs text-muted-foreground">AI生成中...</p>
                <pre className="mt-2 text-xs">{completion}</pre>
              </div>
            )}
            <Button onClick={handleGenerate} disabled={isLoading} size="lg" className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 生成中
                </>
              ) : (
                "生成追问"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 追问列表 */}
        {inquiries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">AI 为你生成了 {inquiries.length} 个追问:</h2>
            {inquiries.map((inquiry, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={priorityConfig[inquiry.priority]?.className}>
                      {priorityConfig[inquiry.priority]?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">优先级 {inquiry.priority}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-lg font-medium leading-relaxed">{inquiry.question}</p>
                  <p className="text-sm text-muted-foreground">{inquiry.context}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 如果没有追问 */}
        {inquiries.length === 0 && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                点击上方按钮生成追问。AI 会根据你的最新状态生成高价值问题。
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
