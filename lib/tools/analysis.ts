import { createDeepSeek } from "@ai-sdk/deepseek"
import { generateText, tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getOrCreateDefaultUser } from "@/lib/user"

export const analyzePlanAndSuggestTodos = tool({
  description: "深度分析用户的目标，提出具体问题和细化建议，然后自动生成具体的 Todo 列表",
  inputSchema: z.object({
    userGoal: z.string().describe("用户表达的目标或计划"),
    context: z.string().optional().describe("额外的背景信息或上下文"),
  }),
  execute: async ({ userGoal, context }) => {
    const deepseek = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY,
    })

    // 第一步：深度分析，提出问题
    const analysisPrompt = `用户目标: ${userGoal}
${context ? `背景信息: ${context}` : ""}

请深度分析这个目标，并按以下格式返回：

## 理解
对用户目标的简要理解和重述

## 关键问题
列出 3-5 个需要澄清的具体问题（这些问题可以帮助更好地规划）

## 初步拆解
基于目标本身，建议的主要阶段或组成部分

## 可能的风险
列出可能的阻碍和注意事项

## 建议的 Todo 拆分
按照时间序列或优先级提出 5-8 个具体的、可执行的 Todo 任务`

    console.log("[分析] analysisPrompt：", analysisPrompt)

    const analysis = await generateText({
      model: deepseek("deepseek-chat"),
      prompt: analysisPrompt,
    })

    console.log("[分析] analysis.text：", analysis.text)

    // 第二步：基于分析生成结构化的 Todo
    const todoPlanPrompt = `基于以下分析结果，请生成一份 JSON 格式的 Todo 列表。

分析结果:
${analysis.text}

请生成 JSON 数组，格式如下（必须是有效的 JSON）：
[
  {
    "title": "Todo标题",
    "description": "详细描述",
    "priority": "high",
    "estimatedHours": 4
  }
]

说明：
- priority: low, medium, high, urgent
- estimatedHours: 估计需要的小时数
- 返回 5-8 个 Todo
- 只返回 JSON，不要其他文字`

    console.log("[Todo生成] todoPlanPrompt：", todoPlanPrompt)

    const todoList = await generateText({
      model: deepseek("deepseek-chat"),
      prompt: todoPlanPrompt,
    })

    console.log("[Todo生成] todoList.text：", todoList.text)

    // 解析 JSON 并创建 Todo
    try {
      const todos = JSON.parse(todoList.text)
      console.log("[解析] 解析到 todos：", todos)
      const user = await getOrCreateDefaultUser()
      console.log("[用户] 获取用户：", user)

      const createdTodos = []
      for (const todo of todos.slice(0, 8)) {
        console.log("[创建Todo] 当前todo：", todo)
        const created = await prisma.todo.create({
          data: {
            userId: user.id,
            title: todo.title,
            description: todo.description,
            priority: todo.priority || "medium",
            status: "pending",
            dueDate: null,
          },
        })
        createdTodos.push(created.title)
        console.log("[创建Todo] 创建成功：", created.title)
      }

      const result = `成功分析目标并创建 ${createdTodos.length} 个 Todo:
${createdTodos.map((t) => `- ${t}`).join("\n")}

分析过程:
${analysis.text}`
      console.log("[最终结果] 返回：", result)
      return result
    } catch (e) {
      console.error("[错误] Todo 解析或创建失败：", e, "返回原始分析：", analysis.text)
      return `分析完成，但 Todo 生成失败: ${analysis.text}`
    }
  },
})
