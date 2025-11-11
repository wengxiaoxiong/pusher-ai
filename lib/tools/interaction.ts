import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireCurrentUser } from "@/lib/auth"

export const saveInteraction = tool({
  description: "保存本次对话交互到数据库",
  inputSchema: z.object({
    userInput: z.string().describe("用户的输入文本"),
    summary: z.string().describe("AI 的回复总结"),
  }),
  execute: async ({ userInput, summary }) => {
    const user = await requireCurrentUser()

    await prisma.interaction.create({
      data: {
        userId: user.id,
        type: "align",
        userInput,
        aiResponse: summary,
      },
    })
    return "交互已保存"
  },
})
