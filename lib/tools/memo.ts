import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getOrCreateDefaultUser } from "@/lib/user"

export const queryMemos = tool({
  description: "查询用户保存的长期记忆备忘录",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe("筛选分类（如: financial, technical, team 等，不填则返回全部）"),
  }),
  execute: async ({ category }) => {
    const user = await getOrCreateDefaultUser()

    const memos = await prisma.memo.findMany({
      where: {
        userId: user.id,
        ...(category && { category }),
      },
      orderBy: { lastReviewedAt: "desc" },
    })

    if (memos.length === 0) {
      return "当前没有任何备忘录"
    }

    const formatted = memos
      .map((m) => `- **${m.key}**: ${m.content}${m.category ? ` [${m.category}]` : ""}`)
      .join("\n")
    return `找到 ${memos.length} 个备忘录：\n${formatted}`
  },
})

export const saveMemo = tool({
  description: "保存或更新一条长期记忆备忘录",
  inputSchema: z.object({
    key: z.string().describe("备忘录的唯一标识符 (使用 kebab-case)"),
    content: z.string().describe("备忘录的内容"),
    category: z
      .string()
      .optional()
      .describe("备忘录的分类 (如: financial, technical, team 等)"),
  }),
  execute: async ({ key, content, category }) => {
    const user = await getOrCreateDefaultUser()

    await prisma.memo.upsert({
      where: {
        userId_key: {
          userId: user.id,
          key,
        },
      },
      create: {
        userId: user.id,
        key,
        content,
        category,
        lastReviewedAt: new Date(),
      },
      update: {
        content,
        category,
        lastReviewedAt: new Date(),
      },
    })
    return `成功保存备忘录 "${key}"`
  },
})

export const deleteMemo = tool({
  description: "删除用户指定的备忘录",
  inputSchema: z.object({
    memoKey: z.string().describe("备忘录的唯一标识符或关键词"),
  }),
  execute: async ({ memoKey }) => {
    const user = await getOrCreateDefaultUser()

    const matchingMemo = await prisma.memo.findFirst({
      where: {
        userId: user.id,
        key: {
          contains: memoKey,
          mode: "insensitive",
        },
      },
    })

    if (matchingMemo) {
      await prisma.memo.delete({
        where: { id: matchingMemo.id },
      })
      return `成功删除备忘录 "${matchingMemo.key}"`
    }
    return `未找到匹配的备忘录: ${memoKey}`
  },
})
