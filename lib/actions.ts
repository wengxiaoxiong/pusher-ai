'use server'

import { prisma } from '@/lib/prisma'
import { getOrCreateDefaultUser } from '@/lib/user'

export type DashboardData = {
  todos: Array<{
    id: string
    title: string
    status: string
    dueDate?: string
    priority: string
    isBlocker: boolean
    lastCommitment: string | null
  }>
  milestones: Array<{
    id: string
    title: string
    progress: number
    dueDate?: string
    priority: string
    target: string | null
  }>
  memos: Array<{
    id: string
    key: string
    content: string
    category: string | null
    lastReviewedAt?: string
  }>
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const user = await getOrCreateDefaultUser()

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

    return {
      todos: todos.map(todo => ({
        id: todo.id,
        title: todo.title,
        status: todo.status,
        dueDate: todo.dueDate?.toISOString(),
        priority: todo.priority,
        isBlocker: todo.isBlocker,
        lastCommitment: todo.lastCommitment,
      })),
      milestones: milestones.map(milestone => ({
        id: milestone.id,
        title: milestone.title,
        progress: milestone.progress,
        dueDate: milestone.dueDate?.toISOString(),
        priority: milestone.priority,
        target: milestone.target,
      })),
      memos: memos.map(memo => ({
        id: memo.id,
        key: memo.key,
        content: memo.content,
        category: memo.category,
        lastReviewedAt: memo.lastReviewedAt?.toISOString(),
      })),
    }
  } catch (error) {
    console.error('getDashboardData error', error)
    throw new Error('获取数据失败')
  }
}
