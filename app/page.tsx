"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Brain, MessageSquare, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* 头部 */}
        <div className="text-center space-y-4">
          <Badge className="bg-foreground text-background px-4 py-1.5">
            AiPusher
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight">
            让 AI 帮你<span className="text-muted-foreground">完成目标</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            通过「拉齐」记录进展,通过「追问」保持节奏。<br />
            简单、高效、智能的个人目标管理系统。
          </p>
        </div>

        {/* 核心功能卡片 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 拉齐 */}
          <Card className="border-2 hover:border-foreground/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-foreground text-background">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">拉齐</CardTitle>
                  <CardDescription>记录进展,同步状态</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                用自然语言输入你的进展,AI 会自动提取:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  完成的任务和成就
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  遇到的阻塞和困难
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  做出的决策和计划
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  里程碑进度更新
                </li>
              </ul>
              <Link href="/align" className="block">
                <Button className="w-full" size="lg">
                  开始拉齐 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 追问 */}
          <Card className="border-2 hover:border-foreground/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-muted text-foreground">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">追问</CardTitle>
                  <CardDescription>保持节奏,高效反思</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI 根据你的 Todos、里程碑和记忆,生成 1-3 个高价值问题:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  关键路径是否顺利?
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  阻塞是否已解决?
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  承诺是否已完成?
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  节奏是否需要调整?
                </li>
              </ul>
              <Link href="/inquiry" className="block">
                <Button className="w-full" variant="outline" size="lg">
                  生成追问 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 仪表盘入口 */}
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">查看我的仪表盘</p>
                  <p className="text-sm text-muted-foreground">
                    查看所有 Todos、里程碑和长期记忆
                  </p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button variant="ghost">
                  前往 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 使用提示 */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            💡 建议每天 21:00 进行一次拉齐,每 5 小时收到一次追问提醒
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by DeepSeek AI · 数据安全存储于 PostgreSQL
          </p>
        </div>
      </div>
    </div>
  )
}
