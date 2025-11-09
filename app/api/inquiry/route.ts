import { createDeepSeek } from "@ai-sdk/deepseek"
import { streamText } from "ai"

export async function POST(req: Request) {
  try {
    const { todos, milestones, memos, signals, lastAlignAt } = await req.json()

    // 初始化 DeepSeek
    const deepseek = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    // 构建给AI的上下文信息
    const contextInfo = buildContextInfo({ todos, milestones, memos, signals, lastAlignAt })

    const systemPrompt = `你是一个专业的个人管理助手。根据用户当前的状态,生成 1-3 个高价值的追问问题。

你必须返回一个有效的JSON数组,格式如下:
[
  {
    "question": "PitchLab 的 7 天 3 集计划进度如何?按现在的节奏能完成吗?",
    "context": "上次说需要 8 小时/集,已完成 1 集",
    "priority": 1
  }
]

追问设计原则:

1. **优先级1 - 关键路径问题** (最重要):
   - 里程碑进度严重落后或风险高
   - 被标记为阻塞的Todo
   - 截止时间紧迫但进度不足

2. **优先级2 - 风险跟进**:
   - 上次识别的风险是否有变化
   - 上下文变化是否需要调整计划
   - 用户之前的承诺是否完成

3. **优先级3 - 周期性回顾**:
   - 长期记忆的有效性检查
   - 长期目标的对齐度检查
   - 距离上次拉齐时间较长的提醒

问题质量要求:
- ❌ 不要问"你今天做了什么"(这是拉齐的工作)
- ✅ 问"这个方向对吗"、"你是否卡住了"、"按这个节奏能完成吗"
- 问题应该**可回答性强**:用户能在1-2分钟内给出答案
- 问题要**直指性强**:明确指向具体的里程碑、Todo或决策
- 如果没有紧急问题,可以少于3个问题

注意:
- 只返回JSON数组,不要有其他文字说明
- priority必须是数字1、2或3`

    const userPrompt = `当前系统状态:

${contextInfo}

请生成追问列表:`

    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: systemPrompt,
      prompt: userPrompt,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("inquiry api error", error)
    return new Response("AI追问生成失败,请稍后再试", { status: 500 })
  }
}

function buildContextInfo(payload: any): string {
  const { todos, milestones, memos, signals, lastAlignAt } = payload
  const now = new Date()

  let info = ""

  // 1. Todos 信息
  if (todos && todos.length > 0) {
    info += "### Todos\n\n"
    const activeTodos = todos.filter((t: any) => t.status !== "completed")
    const blockerTodos = activeTodos.filter((t: any) => t.isBlocker)

    if (blockerTodos.length > 0) {
      info += "**阻塞中的Todo**:\n"
      blockerTodos.forEach((t: any) => {
        info += `- ${t.title} (状态: ${mapStatus(t.status)})\n`
        if (t.lastCommitment) info += `  承诺: ${t.lastCommitment}\n`
        if (t.dueDate) info += `  截止: ${formatDate(t.dueDate)}\n`
      })
      info += "\n"
    }

    const overdueTodos = activeTodos.filter((t: any) => t.dueDate && new Date(t.dueDate) < now)
    if (overdueTodos.length > 0) {
      info += "**逾期的Todo**:\n"
      overdueTodos.forEach((t: any) => {
        info += `- ${t.title} (截止: ${formatDate(t.dueDate)})\n`
      })
      info += "\n"
    }

    if (activeTodos.length > 0 && blockerTodos.length === 0 && overdueTodos.length === 0) {
      info += "**进行中的Todo**:\n"
      activeTodos.slice(0, 5).forEach((t: any) => {
        info += `- ${t.title} (${mapStatus(t.status)})\n`
      })
      info += "\n"
    }
  }

  // 2. Milestones 信息
  if (milestones && milestones.length > 0) {
    info += "### 里程碑\n\n"
    milestones.forEach((m: any) => {
      const daysToDue = m.dueDate ? diffInDays(now, new Date(m.dueDate)) : null
      const isRisky = isRiskyMilestone(m.progress, daysToDue)

      info += `- **${m.title}**: ${m.progress}%`
      if (m.dueDate) {
        info += ` (截止: ${formatDate(m.dueDate)}, 剩余${daysToDue}天)`
      }
      if (isRisky) {
        info += ` ⚠️ 风险高`
      }
      info += "\n"
      if (m.target) {
        info += `  目标: ${m.target}\n`
      }
    })
    info += "\n"
  }

  // 3. 风险信号
  if (signals && signals.risks && signals.risks.length > 0) {
    info += "### 风险信号\n\n"
    signals.risks.forEach((r: string) => {
      info += `- ${r}\n`
    })
    info += "\n"
  }

  // 4. 上下文变化
  if (signals && signals.context_changes && signals.context_changes.length > 0) {
    info += "### 上下文变化\n\n"
    signals.context_changes.forEach((c: string) => {
      info += `- ${c}\n`
    })
    info += "\n"
  }

  // 5. 长期记忆
  if (memos && memos.length > 0) {
    info += "### 长期记忆 (Memos)\n\n"
    memos.forEach((m: any) => {
      info += `- **${m.key}**: ${m.content}\n`
      if (m.category) info += `  类别: ${m.category}\n`
    })
    info += "\n"
  }

  // 6. 上次拉齐时间
  if (lastAlignAt) {
    const hoursSinceAlign = Math.floor((now.getTime() - new Date(lastAlignAt).getTime()) / (1000 * 60 * 60))
    info += `### 时间信息\n\n`
    info += `上次拉齐: ${formatDateTime(new Date(lastAlignAt))} (${hoursSinceAlign}小时前)\n\n`
  }

  return info || "当前没有足够的状态信息"
}

function isRiskyMilestone(progress: number, daysToDue: number | null): boolean {
  if (progress >= 100) return false
  if (daysToDue === null) return progress < 50
  if (daysToDue <= 3) return progress < 90
  if (daysToDue <= 7) return progress < 70
  return false
}

function diffInDays(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((b.getTime() - a.getTime()) / msPerDay)
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatDateTime(value: Date): string {
  return `${value.getMonth() + 1}/${value.getDate()} ${value.getHours().toString().padStart(2, "0")}:${value
    .getMinutes()
    .toString()
    .padStart(2, "0")}`
}

function mapStatus(status: string): string {
  switch (status) {
    case "completed":
      return "已完成"
    case "in_progress":
      return "进行中"
    default:
      return "未开始"
  }
}
