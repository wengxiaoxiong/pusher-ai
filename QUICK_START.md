# 用户系统快速开始指南

## 30 秒快速入门

### 1. 在服务器函数中获取用户和记忆

```typescript
import { getCurrentUserId } from '@/lib/auth'
import { getUserMemory, addMemoryEntry } from '@/lib/user'

// 自动从 Cookie 获取用户 ID
const userId = await getCurrentUserId()

// 获取用户长期记忆
const memory = await getUserMemory(userId)

// 保存信息到长期记忆
await addMemoryEntry(userId, 'myKey', { data: 'value' })
```

### 2. 在 API 路由中使用

```typescript
import { getCurrentUserId } from '@/lib/auth'
import { addMemoryEntry } from '@/lib/user'

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  const body = await request.json()

  await addMemoryEntry(userId, 'userInput', body)

  return NextResponse.json({ success: true })
}
```

### 3. 在前端中使用

```typescript
// 获取用户
const user = await fetch('/api/users').then(r => r.json())

// 保存数据
await fetch(`/api/users/${user.id}/memory/myKey`, {
  method: 'POST',
  body: JSON.stringify({ value: { myData: '...' } })
})

// 读取数据
const memory = await fetch(`/api/users/${user.id}/memory`).then(r => r.json())
```

## 常用操作

| 操作 | 代码 |
|------|------|
| 获取当前用户 ID | `const userId = await getCurrentUserId()` |
| 获取所有记忆 | `await getUserMemory(userId)` |
| 保存记忆 | `await addMemoryEntry(userId, key, value)` |
| 批量更新 | `await updateUserMemory(userId, { key: value })` |
| 删除记忆 | `await deleteMemoryEntry(userId, key)` |
| 清除所有记忆 | `await clearUserMemory(userId)` |

## 文件位置

- **服务函数**: `lib/user.ts`
- **认证工具**: `lib/auth.ts`
- **API 路由**: `app/api/users/`
- **数据库**: `prisma/schema.prisma`
- **完整文档**: `USER_SYSTEM.md`

## 典型用法示例

### 在拉齐功能中使用

```typescript
import { getCurrentUserId } from '@/lib/auth'
import { getUserMemory, updateUserMemory } from '@/lib/user'

export async function handleAlign(userInput: string) {
  const userId = await getCurrentUserId()

  // 获取用户上下文
  const memory = await getUserMemory(userId)

  // AI 处理
  const response = await callAI(userInput, memory)

  // 更新记忆（保存本次拉齐结果）
  await updateUserMemory(userId, {
    lastAlignAt: new Date().toISOString(),
    lastAlignResult: response
  })

  return response
}
```

### 在追问功能中使用

```typescript
export async function handleInquiry() {
  const userId = await getCurrentUserId()
  const memory = await getUserMemory(userId)

  // 根据记忆生成问题
  const questions = await generateQuestions(memory)

  return questions
}
```

### 保存用户反馈

```typescript
export async function saveFeedback(userResponse: string) {
  const userId = await getCurrentUserId()

  await addMemoryEntry(userId, 'lastUserResponse', {
    response: userResponse,
    timestamp: new Date().toISOString()
  })
}
```

## 下一步

- 在现有的 align 路由中集成长期记忆
- 在 inquiry 路由中使用长期记忆生成问题
- 为长期记忆添加更新、查看和编辑的前端界面
