import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireCurrentUser } from "@/lib/auth"

export const markTodoComplete = tool({
  description: "将用户指定的 Todo 标记为完成",
  inputSchema: z.object({
    todoTitle: z.string().describe("Todo 的标题或关键词"),
  }),
  execute: async ({ todoTitle }) => {
    const user = await requireCurrentUser()

    // 尝试模糊匹配 title（不区分大小写）
    const matchingTodo = await prisma.todo.findFirst({
      where: {
        userId: user.id,
        title: {
          contains: todoTitle,
          mode: "insensitive",
        },
        NOT: { status: "completed" },
      },
    })

    if (matchingTodo) {
      await prisma.todo.update({
        where: { id: matchingTodo.id },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      })
      return `成功标记 Todo "${matchingTodo.title}" 为完成`
    }
    return `未找到匹配的 Todo: ${todoTitle}`
  },
})

export const queryTodos = tool({
  description: "查询用户当前的所有 Todo 列表",
  inputSchema: z.object({
    status: z
      .enum(["pending", "in_progress", "completed", "all"])
      .optional()
      .describe("筛选状态（pending=未开始，in_progress=进行中，completed=已完成，all=全部）"),
  }),
  execute: async ({ status = "all" }) => {
    const user = await requireCurrentUser()

    const todos = await prisma.todo.findMany({
      where: {
        userId: user.id,
        ...(status !== "all" && { status }),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    })

    if (todos.length === 0) {
      return "当前没有任何 Todo"
    }

    const priorityEmoji: Record<string, string> = {
      urgent: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🟢",
    }

    const formatted = todos
      .map((t) => `- ${priorityEmoji[t.priority] || "⚪"} ${t.title} [${t.status}]${t.isBlocker ? " ⚠️ 阻塞" : ""}${t.dueDate ? ` (截止: ${t.dueDate.toLocaleDateString("zh-CN")})` : ""}`)
      .join("\n")
    return `找到 ${todos.length} 个 Todo：\n${formatted}`
  },
})

export const addTodo = tool({
  description: "为用户添加一个新的 Todo",
  inputSchema: z.object({
    title: z.string().describe("Todo 的标题"),
    description: z
      .string()
      .optional()
      .describe("Todo 的详细描述"),
    isBlocker: z
      .boolean()
      .optional()
      .describe("是否为阻塞性任务（默认 false）"),
    dueDate: z
      .string()
      .optional()
      .describe("截止日期（ISO 8601 格式）"),
    priority: z
      .enum(["low", "medium", "high", "urgent"])
      .optional()
      .describe("优先级（low=低, medium=中, high=高, urgent=紧急，默认 medium）"),
  }),
  execute: async ({ title, description, isBlocker = false, dueDate, priority = "medium" }) => {
    const user = await requireCurrentUser()

    const todo = await prisma.todo.create({
      data: {
        userId: user.id,
        title,
        description,
        isBlocker,
        priority,
        status: "pending",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    return `成功添加 Todo "${todo.title}"${isBlocker ? " (阻塞性任务)" : ""} [${priority}优先级]`
  },
})

export const deleteTodo = tool({
  description: "删除用户指定的 Todo",
  inputSchema: z.object({
    todoTitle: z.string().describe("Todo 的标题或关键词"),
  }),
  execute: async ({ todoTitle }) => {
    const user = await requireCurrentUser()

    const matchingTodo = await prisma.todo.findFirst({
      where: {
        userId: user.id,
        title: {
          contains: todoTitle,
          mode: "insensitive",
        },
      },
    })

    if (matchingTodo) {
      await prisma.todo.delete({
        where: { id: matchingTodo.id },
      })
      return `成功删除 Todo "${matchingTodo.title}"`
    }
    return `未找到匹配的 Todo: ${todoTitle}`
  },
})
