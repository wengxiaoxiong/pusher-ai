"use client"

import { useEffect, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getDashboardData } from "@/lib/actions"
import type { AlignMessage } from "@/app/api/align/route"
import { DashboardPanel } from "@/components/align/DashboardPanel"
import { MessageBubble } from "@/components/align/MessageBubble"
import { LogoutButton } from "@/components/auth/logout-button"

const defaultText = `今天完成了 PitchLab 第二集脚本,也把数据校验任务搞定。
广告投放里程碑进度提升到 55%,但剪辑资源仍然卡住,供应商迟迟没有反馈。
决定明天上午和设计一起评审 demo,并调整直播节奏。
记得补充现金流 memo:财务预警阈值下调到 3 万。
团队临时调整了周五例会时间。`

type Todo = {
  id: string
  title: string
  status: string
  dueDate?: string
  priority: string
  isBlocker: boolean
  lastCommitment: string | null
}

type Milestone = {
  id: string
  title: string
  progress: number
  dueDate?: string
  priority: string
  target: string | null
}

type Memo = {
  id: string
  key: string
  content: string
  category: string | null
}

export default function AlignPage() {
  const router = useRouter()
  const [input, setInput] = useState(defaultText)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [todos, setTodos] = useState<Todo[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [showDeletePanel, setShowDeletePanel] = useState(false)

  const { messages, sendMessage, status, error } = useChat<AlignMessage>({
    transport: new DefaultChatTransport({
      api: "/api/align",
    }),
  })

  // 加载 Dashboard 数据
  const loadDashboardData = async () => {
    try {
      setLoadingDashboard(true)
      const data = await getDashboardData()
      setTodos(data.todos || [])
      setMilestones(data.milestones || [])
      setMemos(data.memos || [])
    } catch (error) {
      console.error("Load dashboard data error:", error)
    } finally {
      setLoadingDashboard(false)
    }
  }

  // 初始加载 Dashboard
  useEffect(() => {
    loadDashboardData()
  }, [])

  // 监听消息变化，在 function call 执行后刷新 dashboard
  useEffect(() => {
    const hasToolCalls = messages.some(
      (message) =>
        message.role === "assistant" &&
        message.parts?.some((part) => part.type.startsWith("tool-"))
    )

    if (hasToolCalls) {
      setTimeout(() => loadDashboardData(), 500)
    }
  }, [messages])

  const isLoading = status === "streaming"

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) {
      alert("请输入需要拉齐的文本")
      return
    }

    setIsSubmitted(true)
    await sendMessage({
      text: input,
    })
    setUserInput("")
  }

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) {  
      return
    }

    await sendMessage({
      text: userInput,
    })
    setUserInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form && isSubmitted) {
        handleFollowUp({ preventDefault: () => {} } as React.FormEvent)
      }
    }
  }

  return (
    <div className="flex flex-col bg-background">

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="mx-auto max-w-7xl h-full">
          <div className="mb-4 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" /> 返回首页
              </Button>
            </Link>
            <LogoutButton variant="outline" size="sm" />
          </div>
          <ScrollArea className="h-full pr-4">
            <div className="pr-2">
              {/* 初始输入区域 */}
              {!isSubmitted ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  {/* 左侧：输入框 */}
                  <div className="lg:col-span-2 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                      <CardHeader>
                        <CardTitle>输入你的进展</CardTitle>
                        <CardDescription>
                          用自然语言描述你今天做了什么、遇到了什么问题、做出了什么决策
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="记录你的进展、风险与下一步计划..."
                          className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                          disabled={isLoading}
                        />
                        {error && <p className="mt-2 text-sm text-red-500">失败: {error.message}</p>}
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <p className="text-xs text-muted-foreground">
                          AI 会帮助你整理信息、更新任务和里程碑
                        </p>
                        <Button onClick={handleInitialSubmit} disabled={isLoading} size="lg">
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在处理
                            </>
                          ) : (
                            "开始拉齐"
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>

                  {/* 右侧：Dashboard 面板 */}
                  <DashboardPanel
                    todos={todos}
                    milestones={milestones}
                    memos={memos}
                    isLoading={isLoading}
                    loadingDashboard={loadingDashboard}
                    showDeletePanel={showDeletePanel}
                    onRefresh={loadDashboardData}
                    onToggleDeletePanel={() => setShowDeletePanel(!showDeletePanel)}
                    onDelete={() => setTimeout(() => loadDashboardData(), 500)}
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* 左侧：对话区域 */}
                    <div className="lg:col-span-2 flex flex-col h-full">
                      <Card className="flex flex-col overflow-hidden">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle>拉齐对话</CardTitle>
                          <CardDescription>
                            与 AI 进行对话，讨论和确认要更新的内容
                          </CardDescription>
                        </CardHeader>
                        <ScrollArea className="flex-1 min-h-0">
                          <div className="space-y-4 px-6 py-4">
                            {messages.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-8">
                                开始对话...
                              </p>
                            ) : (
                              messages.map((message, index) => (
                                <MessageBubble key={index} message={message} index={index} />
                              ))
                            )}
                            {isLoading && (
                              <div className="flex gap-3 justify-start">
                                <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                                    <div
                                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                      style={{ animationDelay: "0.2s" }}
                                    />
                                    <div
                                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                      style={{ animationDelay: "0.4s" }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                        <CardFooter className="flex-shrink-0">
                          <form className="w-full flex gap-2" onSubmit={handleFollowUp}>
                            <input
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="继续对话或输入反馈..."
                              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                              disabled={isLoading}
                            />
                            <Button
                              type="submit"
                              disabled={isLoading || !userInput.trim()}
                              size="sm"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </form>
                        </CardFooter>
                      </Card>
                    </div>

                    {/* 右侧：Dashboard 面板 */}
                    <DashboardPanel
                      todos={todos}
                      milestones={milestones}
                      memos={memos}
                      isLoading={isLoading}
                      loadingDashboard={loadingDashboard}
                      showDeletePanel={showDeletePanel}
                      onRefresh={loadDashboardData}
                      onToggleDeletePanel={() => setShowDeletePanel(!showDeletePanel)}
                      onDelete={() => setTimeout(() => loadDashboardData(), 500)}
                    />
                  </div>

                  {/* 导航按钮 */}
                  <div className="flex gap-4 mt-6">
                    <Button onClick={() => router.push("/dashboard")} className="flex-1">
                      查看完整仪表盘
                    </Button>
                    <Button onClick={() => router.push("/inquiry")} variant="outline" className="flex-1">
                      生成追问
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
