import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireCurrentUser } from "@/lib/auth"

export const updateMilestoneProgress = tool({
  description: "更新里程碑的进度百分比",
  inputSchema: z.object({
    milestoneName: z.string().describe("里程碑的名称"),
    progress: z
      .number()
      .min(0)
      .max(100)
      .describe("进度百分比 (0-100)"),
  }),
  execute: async ({ milestoneName, progress }) => {
    const user = await requireCurrentUser()

    // 尝试模糊匹配 title（不区分大小写）
    const matchingMilestone = await prisma.milestone.findFirst({
      where: {
        userId: user.id,
        title: {
          contains: milestoneName,
          mode: "insensitive",
        },
      },
    })

    if (matchingMilestone) {
      await prisma.milestone.update({
        where: { id: matchingMilestone.id },
        data: {
          progress: Math.min(100, Math.max(0, progress)),
        },
      })
      return `成功更新里程碑 "${matchingMilestone.title}" 进度为 ${progress}%`
    }
    return `未找到匹配的里程碑: ${milestoneName}`
  },
})

export const queryMilestones = tool({
  description: "查询用户当前的所有里程碑列表",
  inputSchema: z.object({
    includeCompleted: z
      .boolean()
      .optional()
      .describe("是否包含已完成的里程碑（默认 false）"),
  }),
  execute: async ({ includeCompleted = false }) => {
    const user = await requireCurrentUser()

    const milestones = await prisma.milestone.findMany({
      where: {
        userId: user.id,
        ...(includeCompleted === false && { progress: { lt: 100 } }),
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    })

    if (milestones.length === 0) {
      return "当前没有任何里程碑"
    }

    const priorityEmoji: Record<string, string> = {
      urgent: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🟢",
    }

    const formatted = milestones
      .map((m) => `- ${priorityEmoji[m.priority] || "⚪"} ${m.title}: ${m.progress}%${m.dueDate ? ` (截止: ${m.dueDate.toLocaleDateString("zh-CN")})` : ""}`)
      .join("\n")
    return `找到 ${milestones.length} 个里程碑：\n${formatted}`
  },
})

export const addMilestone = tool({
  description: "为用户添加一个新的里程碑",
  inputSchema: z.object({
    title: z.string().describe("里程碑的标题"),
    description: z
      .string()
      .optional()
      .describe("里程碑的详细描述"),
    target: z
      .string()
      .optional()
      .describe("里程碑的目标描述"),
    dueDate: z
      .string()
      .optional()
      .describe("截止日期（ISO 8601 格式）"),
    priority: z
      .enum(["low", "medium", "high", "urgent"])
      .optional()
      .describe("优先级（low=低, medium=中, high=高, urgent=紧急，默认 medium）"),
  }),
  execute: async ({ title, description, target, dueDate, priority = "medium" }) => {
    const user = await requireCurrentUser()

    const milestone = await prisma.milestone.create({
      data: {
        userId: user.id,
        title,
        description,
        target,
        progress: 0,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    return `成功添加里程碑 "${milestone.title}" [${priority}优先级]`
  },
})

export const deleteMilestone = tool({
  description: "删除用户指定的里程碑",
  inputSchema: z.object({
    milestoneName: z.string().describe("里程碑的名称或关键词"),
  }),
  execute: async ({ milestoneName }) => {
    const user = await requireCurrentUser()

    const matchingMilestone = await prisma.milestone.findFirst({
      where: {
        userId: user.id,
        title: {
          contains: milestoneName,
          mode: "insensitive",
        },
      },
    })

    if (matchingMilestone) {
      await prisma.milestone.delete({
        where: { id: matchingMilestone.id },
      })
      return `成功删除里程碑 "${matchingMilestone.title}"`
    }
    return `未找到匹配的里程碑: ${milestoneName}`
  },
})
