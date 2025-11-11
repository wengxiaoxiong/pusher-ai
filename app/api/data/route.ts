import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireCurrentUser()

    const [todos, milestones, memos] = await Promise.all([
      prisma.todo.findMany({
        where: { userId: user.id },
        orderBy: [
          { createdAt: 'desc' },
        ],
      }),
      prisma.milestone.findMany({
        where: { userId: user.id },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.memo.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      todos: todos.map(todo => ({
        id: todo.id,
        title: todo.title,
        status: todo.status,
        dueDate: todo.dueDate?.toISOString(),
        isBlocker: todo.isBlocker,
        lastCommitment: todo.lastCommitment,
      })),
      milestones: milestones.map(milestone => ({
        id: milestone.id,
        title: milestone.title,
        progress: milestone.progress,
        dueDate: milestone.dueDate?.toISOString(),
        target: milestone.target,
      })),
      memos: memos.map(memo => ({
        id: memo.id,
        key: memo.key,
        content: memo.content,
        category: memo.category,
        lastReviewedAt: memo.lastReviewedAt?.toISOString(),
      })),
    })
  } catch (error) {
    console.error("get data error", error)
    const isAuthError = error instanceof Error && /未登录|未找到用户/.test(error.message)
    return NextResponse.json(
      { error: isAuthError ? "未登录" : "获取数据失败" },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
