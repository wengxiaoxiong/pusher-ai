import { prisma } from './prisma'

// 获取或创建默认用户 (简化版,实际应该使用认证系统)
export async function getOrCreateDefaultUser() {
  const defaultEmail = 'demo@aipusher.com'

  let user = await prisma.user.findUnique({
    where: { email: defaultEmail },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: defaultEmail,
        name: 'Demo User',
        longTermMemory: {},
      },
    })
  }

  return user
}

// 获取用户信息
export async function getUser(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
  })
}

// 创建新用户
export async function createUser(data: { name: string; email?: string }) {
  return await prisma.user.create({
    data: {
      ...data,
      longTermMemory: {},
    },
  })
}

// 更新用户信息
export async function updateUser(
  userId: string,
  data: { name?: string; email?: string }
) {
  return await prisma.user.update({
    where: { id: userId },
    data,
  })
}

// 获取用户的长期记忆
export async function getUserMemory(userId: string): Promise<Record<string, unknown>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { longTermMemory: true },
  })
  const memory = user?.longTermMemory
  return typeof memory === 'object' && memory !== null ? (memory as Record<string, unknown>) : {}
}

// 更新用户长期记忆
export async function updateUserMemory(
  userId: string,
  updates: Record<string, unknown>
) {
  const currentMemory = await getUserMemory(userId)
  const updatedMemory: Record<string, unknown> = Object.assign({}, currentMemory, updates)

  return await prisma.user.update({
    where: { id: userId },
    data: {
      longTermMemory: updatedMemory as any,
    },
  })
}

// 添加或合并长期记忆条目
export async function addMemoryEntry(
  userId: string,
  key: string,
  value: unknown
) {
  const currentMemory = await getUserMemory(userId)
  const updatedMemory: Record<string, unknown> = Object.assign({}, currentMemory, {
    [key]: value,
  })

  return await prisma.user.update({
    where: { id: userId },
    data: {
      longTermMemory: updatedMemory as any,
    },
  })
}

// 删除长期记忆条目
export async function deleteMemoryEntry(userId: string, key: string) {
  const currentMemory = await getUserMemory(userId)
  const memoryObj = typeof currentMemory === 'object' && currentMemory !== null ? (currentMemory as Record<string, unknown>) : {}
  const { [key]: _, ...updatedMemory } = memoryObj

  return await prisma.user.update({
    where: { id: userId },
    data: {
      longTermMemory: updatedMemory as any,
    },
  })
}

// 清除用户长期记忆
export async function clearUserMemory(userId: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      longTermMemory: {},
    },
  })
}
