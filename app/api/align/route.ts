import { NextResponse } from "next/server"
import { z } from "zod"

import { slugify } from "@/lib/slug"

const alignRequestSchema = z.object({
  text: z.string().min(1, "请提供需要拉齐的文本"),
})

type AlignRequest = z.infer<typeof alignRequestSchema>

type AlignResponse = {
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

const sentenceDelimiters = /[。！？!?\n]+/

const achievementKeywords = ["完成", "搞定", "实现", "交付", "上线"]
const blockerKeywords = ["卡住", "阻塞", "问题", "困难", "风险", "挑战", "延迟"]
const decisionKeywords = ["决定", "计划", "准备", "打算", "安排", "调整"]
const memoKeywords = ["记得", "需要记录", "memo", "提醒", "长期", "灵感"]
const contextKeywords = ["调整", "变化", "改成", "切换", "更换"]
const riskKeywords = ["风险", "担心", "隐患", "紧急", "压力"]

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AlignRequest
    const { text } = alignRequestSchema.parse(body)

    const sentences = text
      .split(sentenceDelimiters)
      .map((sentence) => sentence.trim())
      .filter(Boolean)

    const achievements = collectMatches(sentences, achievementKeywords)
    const blockers = collectMatches(sentences, blockerKeywords)
    const decisions = collectMatches(sentences, decisionKeywords)

    const completedTodos = extractCompletedTodos(sentences)
    const milestoneProgress = extractMilestoneProgress(sentences)
    const newMemos = extractMemos(sentences)

    const risks = collectMatches(sentences, riskKeywords)
    const contextChanges = collectMatches(sentences, contextKeywords)

    const summary = buildSummary({
      achievements,
      blockers,
      decisions,
      milestoneProgress,
      risks,
    })

    const response: AlignResponse = {
      parsed: {
        achievements,
        blockers,
        decisions,
      },
      updates: {
        completed_todos: completedTodos,
        milestone_progress: milestoneProgress,
        new_memos: newMemos,
      },
      signals: {
        risks,
        context_changes: contextChanges.filter((item) => !risks.includes(item)),
      },
      summary,
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors.at(0)?.message ?? "请求无效" }, { status: 400 })
    }

    console.error("align api error", error)
    return NextResponse.json({ error: "解析失败，请稍后再试" }, { status: 500 })
  }
}

function collectMatches(sentences: string[], keywords: string[]) {
  const matches = sentences.filter((sentence) =>
    keywords.some((keyword) => sentence.includes(keyword)),
  )
  return Array.from(new Set(matches))
}

function extractCompletedTodos(sentences: string[]) {
  const completed: string[] = []
  for (const sentence of sentences) {
    if (!achievementKeywords.some((keyword) => sentence.includes(keyword))) continue

    const todoMatch = sentence.match(/(?:完成|搞定|收尾)(?:了)?([\w\s\-_/]*?)(?:任务|todo|事项|工作)?(?=$|[,，。；;!！?？])/i)
    if (todoMatch) {
      const label = todoMatch[1].trim() || sentence
      completed.push(slugify(label))
      continue
    }

    if (sentence.length > 0) {
      completed.push(slugify(sentence))
    }
  }
  return Array.from(new Set(completed))
}

function extractMilestoneProgress(sentences: string[]) {
  const progressUpdates: { id: string; progress: number }[] = []
  for (const sentence of sentences) {
    const match = sentence.match(
      /(?:里程碑|milestone|阶段)\s*([\w\-_/一-龥]+)?[^\d]*(\d{1,3})%/i,
    )
    if (match) {
      const [, rawId, rawProgress] = match
      const id = slugify(rawId ?? sentence)
      const progress = Math.min(100, Number.parseInt(rawProgress ?? "0", 10))
      progressUpdates.push({ id, progress })
    }
  }

  return dedupeBy(progressUpdates, (item) => item.id)
}

function extractMemos(sentences: string[]) {
  const memos: { key: string; content: string; category?: string }[] = []
  for (const sentence of sentences) {
    if (!memoKeywords.some((keyword) => sentence.includes(keyword))) continue

    const keyMatch = sentence.match(/memo[:：]?\s*([\w\-_/一-龥]+)/i)
    const key = slugify(keyMatch?.[1] ?? sentence)
    const category = sentence.includes("目标") ? "goal" : sentence.includes("风险") ? "risk" : undefined
    memos.push({ key, content: sentence, category })
  }

  return dedupeBy(memos, (item) => item.key)
}

function buildSummary({
  achievements,
  blockers,
  decisions,
  milestoneProgress,
  risks,
}: {
  achievements: string[]
  blockers: string[]
  decisions: string[]
  milestoneProgress: { id: string; progress: number }[]
  risks: string[]
}) {
  const parts: string[] = []
  if (achievements.length) {
    parts.push(`识别到 ${achievements.length} 条成就`)
  }
  if (milestoneProgress.length) {
    parts.push(`更新了 ${milestoneProgress.length} 个里程碑进度`)
  }
  if (blockers.length) {
    parts.push(`存在 ${blockers.length} 个潜在阻塞`)
  }
  if (decisions.length) {
    parts.push(`记录 ${decisions.length} 项决策`) 
  }
  if (risks.length) {
    parts.push(`监控 ${risks.length} 个风险信号`)
  }
  return parts.join(" · ") || "已解析输入，等待下一步操作"
}

function dedupeBy<T>(items: T[], keyFn: (item: T) => string) {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}
