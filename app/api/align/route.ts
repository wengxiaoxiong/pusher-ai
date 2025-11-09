import { createDeepSeek, deepseek } from "@ai-sdk/deepseek"
import {
  type InferUITools,
  type ToolSet,
  type UIDataTypes,
  type UIMessage,
  convertToModelMessages,
  streamText,
  stepCountIs,
} from "ai"
import { markTodoComplete, queryTodos, addTodo, deleteTodo } from "@/lib/tools/todo"
import { updateMilestoneProgress, queryMilestones, addMilestone, deleteMilestone } from "@/lib/tools/milestone"
import { queryMemos, saveMemo, deleteMemo } from "@/lib/tools/memo"
import { saveInteraction } from "@/lib/tools/interaction"
import { getUserMemory } from "@/lib/user"
import { getCurrentUserId } from "@/lib/auth"

// 整合所有工具
const tools = {
  markTodoComplete,
  queryTodos,
  addTodo,
  deleteTodo,
  updateMilestoneProgress,
  queryMilestones,
  addMilestone,
  deleteMilestone,
  queryMemos,
  saveMemo,
  deleteMemo,
  saveInteraction,
} satisfies ToolSet

export type AlignTools = InferUITools<typeof tools>
export type AlignMessage = UIMessage<never, UIDataTypes, AlignTools>

export async function POST(req: Request) {
  try {
    const { messages }: { messages: AlignMessage[] } = await req.json()

    // 初始化 DeepSeek
    // const deepseek = createDeepSeek({
    //   apiKey: process.env.DEEPSEEK_API_KEY,
    // })
    const userId = await getCurrentUserId()
    const memory = await getUserMemory(userId)
    const userMemory = formatUserMemory(memory)
    console.log('userMemory', userMemory)
    const systemPrompt = `
    
    
    你是一个具有主观能动性的个人策略顾问和任务教练，不只是一个 To-Do 记录员。你要主动洞察用户的真实诉求，给出建设性的建议、风险判断和后续动作。 
    今天的时间是${new Date().toLocaleDateString("zh-CN")}
    用户所在时区是${Intl.DateTimeFormat().resolvedOptions().timeZone}
    用户说明：${userMemory}

【核心原则】
1. **主动理解**：先判断用户真正想解决的问题，必要时先提 2-3 个聪明的问题再行动。
2. **战略分析**：面对目标或困难时，先总结、拆解、指出阻塞/风险，再决定要不要落地到任务、里程碑或备忘。
3. **行动闭环**：明确告诉用户你做了什么、发现了什么、接下来建议什么，而不是只汇报工具调用结果。
4. **信息整洁**：只在必要时查询；需要留存长期信息时使用 memo；所有对话结束要保存交互。

【工作流 A｜用户信息或长期记忆更新（优先）】
- 触发：用户想更新背景、偏好、长期目标、重要事实等。
- 操作：
  1. 先通过对话提出 2-3 个关键问题，弄清楚要更新的内容、背景和使用场景。
  2. 如需要参考历史，再查询现有数据；否则直接根据上下文判断。
  3. 总结你的理解，确认无误后再写入（例如使用 saveMemo 或相关工具）。
  4. 明确告知用户记录了哪些信息、下一步如何使用。

【工作流 B｜目标规划与任务管理】
- 触发：用户提出新目标、进展、阻塞、想法或需要拆解/排序的任务。
- 操作：
  1. 解构意图：重述目标、识别关键里程碑、依赖和潜在风险，必要时提出澄清问题。
  2. 给出主观洞察：结合经验提出建议、优先级排序、配套指标或注意事项。
  3. 需要落地成行动时再调用工具（addTodo、addMilestone、updateMilestoneProgress、markTodoComplete、saveMemo、delete 系列等）。
  4. 仅在用户明确要查看列表或你确实需要对齐现状时再查询（queryTodos/queryMilestones/queryMemos）。

【工具使用守则】
- 删除、更新、完成任务要使用相应工具，动作要解释原因。
- 当用户提及需要记住的信息时，判断是否写入 memo；提及进度时及时更新 milestone。
- 可以同时调用多个工具，避免

【沟通方式】
- 用自然中文输出，结构清晰（如：洞察/风险/建议/行动）。
- 先分析后回应，展示推理、潜在阻塞和可执行建议。
- 主动提醒潜在的下一步或可探索方向，帮助用户前进一步，而不是等待进一步指令。`

    const result = streamText({
      // model: minimax.chat("MiniMax-M2"),
      // model: moonshot.chat("kimi-k2-thinking"),
      model: deepseek('deepseek-chat'),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(10),
      tools,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("align api error", error)
    return new Response("AI 处理失败，请稍后再试", { status: 500 })
  }
}

function formatUserMemory(memory: Record<string, unknown>): string {
  if (!memory || Object.keys(memory).length === 0) {
    return "暂无长期记忆"
  }

  try {
    return JSON.stringify(memory, null, 2)
  } catch (error) {
    console.warn("formatUserMemory error", error)
    return String(memory)
  }
}
