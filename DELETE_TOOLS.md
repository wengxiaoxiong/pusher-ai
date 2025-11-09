# 删除工具完整指南

本文档详细说明了 AiPusher 系统中所有的删除功能工具。

## 概述

AiPusher 提供了三种主要资源的删除功能：
- **Todo 删除** - 删除待办任务
- **Milestone 删除** - 删除里程碑
- **Memo 删除** - 删除长期记忆

## 1. AI 工具集删除工具（推荐方式）

在 `/api/align` 端点中，AI 可以自动调用以下删除工具：

### 1.1 deleteTodo - 删除待办任务

**描述**: 删除用户指定的 Todo

**用法示例**:
```
用户输入: "删除制作视频这个任务"
AI 会自动调用: deleteTodo({ todoTitle: "制作视频" })
```

**参数**:
```typescript
{
  todoTitle: string  // Todo 的标题或关键词（支持模糊匹配，不区分大小写）
}
```

**返回**:
```
成功: "成功删除 Todo \"Task Name\""
失败: "未找到匹配的 Todo: Task Name"
```

**工作原理**:
1. 接收用户输入中的任务名称
2. 使用模糊匹配搜索包含该关键词的 Todo（不区分大小写）
3. 如果找到，删除该任务
4. 返回操作结果

---

### 1.2 deleteMilestone - 删除里程碑

**描述**: 删除用户指定的里程碑

**用法示例**:
```
用户输入: "删除Q4季度目标这个里程碑"
AI 会自动调用: deleteMilestone({ milestoneName: "Q4季度目标" })
```

**参数**:
```typescript
{
  milestoneName: string  // 里程碑的名称或关键词（支持模糊匹配，不区分大小写）
}
```

**返回**:
```
成功: "成功删除里程碑 \"Milestone Name\""
失败: "未找到匹配的里程碑: Milestone Name"
```

**工作原理**:
1. 接收用户输入中的里程碑名称
2. 使用模糊匹配搜索包含该关键词的里程碑（不区分大小写）
3. 如果找到，删除该里程碑
4. 返回操作结果

---

### 1.3 deleteMemo - 删除长期记忆备忘录

**描述**: 删除用户指定的长期记忆备忘录

**用法示例**:
```
用户输入: "删除财务阈值这个备忘录"
AI 会自动调用: deleteMemo({ memoKey: "财务阈值" })
```

**参数**:
```typescript
{
  memoKey: string  // 备忘录的唯一标识符或关键词（支持模糊匹配，不区分大小写）
}
```

**返回**:
```
成功: "成功删除备忘录 \"memo-key\""
失败: "未找到匹配的备忘录: memo-key"
```

**工作原理**:
1. 接收用户输入中的备忘录标识符
2. 使用模糊匹配搜索包含该关键词的备忘录（不区分大小写）
3. 如果找到，删除该备忘录
4. 返回操作结果

---

## 2. 后端库函数删除工具

对于需要在服务器端代码中直接调用的删除操作，可以使用 `lib/user.ts` 中的函数。

### 2.1 deleteMemoryEntry - 删除单个记忆条目

**位置**: `lib/user.ts:98-109`

**用法**:
```typescript
import { deleteMemoryEntry } from '@/lib/user'

await deleteMemoryEntry(userId, 'myKey')
```

**参数**:
```typescript
userId: string  // 用户 ID
key: string     // 记忆条目的键名
```

**返回**:
```typescript
Promise<User>  // 更新后的用户对象
```

**示例**:
```typescript
// 删除财务阈值
await deleteMemoryEntry(userId, 'financial-threshold')

// 删除上次拉齐的结果
await deleteMemoryEntry(userId, 'lastAlignResult')
```

---

### 2.2 clearUserMemory - 清除所有记忆

**位置**: `lib/user.ts:112-119`

**用法**:
```typescript
import { clearUserMemory } from '@/lib/user'

await clearUserMemory(userId)
```

**参数**:
```typescript
userId: string  // 用户 ID
```

**返回**:
```typescript
Promise<User>  // 更新后的用户对象（longTermMemory 为空对象 {}）
```

**示例**:
```typescript
// 清除用户的所有长期记忆（谨慎使用！）
await clearUserMemory(userId)
```

---

## 3. REST API 删除端点

### 3.1 DELETE /api/users/{userId}/memory/{key}

**位置**: `app/api/users/[userId]/memory/[key]/route.ts:68-86`

**用法**:
```typescript
// 前端
await fetch(`/api/users/userId/memory/memoKey`, {
  method: 'DELETE'
})

// 后端
import fetch from 'node-fetch'

const response = await fetch(
  `/api/users/${userId}/memory/financial-threshold`,
  { method: 'DELETE' }
)
const result = await response.json()
```

**请求**:
```
DELETE /api/users/{userId}/memory/{key}
```

**成功响应** (200):
```json
{
  "message": "记忆条目已删除",
  "key": "financial-threshold"
}
```

**失败响应** (500):
```json
{
  "error": "删除记忆条目失败"
}
```

---

## 4. 数据库模型中的删除操作

### 4.1 删除 Todo

**模型**: Prisma `Todo` 模型

**使用方式**:
```typescript
// 删除单个 Todo
await prisma.todo.delete({
  where: { id: todoId }
})

// 删除多个 Todo
await prisma.todo.deleteMany({
  where: { userId: userId }
})
```

---

### 4.2 删除 Milestone

**模型**: Prisma `Milestone` 模型

**使用方式**:
```typescript
// 删除单个里程碑
await prisma.milestone.delete({
  where: { id: milestoneId }
})

// 删除多个里程碑
await prisma.milestone.deleteMany({
  where: { userId: userId }
})
```

---

### 4.3 删除 Memo

**模型**: Prisma `Memo` 模型

**使用方式**:
```typescript
// 删除单个备忘录
await prisma.memo.delete({
  where: { id: memoId }
})

// 按键删除
await prisma.memo.delete({
  where: {
    userId_key: {
      userId: userId,
      key: 'memo-key'
    }
  }
})

// 删除多个备忘录
await prisma.memo.deleteMany({
  where: { userId: userId }
})
```

---

## 5. 使用示例

### 5.1 在拉齐功能中使用删除工具

用户在拉齐功能中可以直接告诉 AI 要删除什么：

```
用户: "我完成了制作视频，可以删除这个任务。Q4目标也取消了，把那个里程碑也删除。旧的财务记录备忘也不要了。"

AI 会自动：
1. 调用 deleteTodo({ todoTitle: "制作视频" })
2. 调用 deleteMilestone({ milestoneName: "Q4目标" })
3. 调用 deleteMemo({ memoKey: "财务记录" })
```

---

### 5.2 在后端服务中使用删除函数

```typescript
// 在自定义 API 路由中
import { deleteMemoryEntry } from '@/lib/user'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  const userId = await getCurrentUserId()

  // 删除长期记忆
  await deleteMemoryEntry(userId, 'old-memo-key')

  // 删除已过期的 Todo
  const expiredTodos = await prisma.todo.findMany({
    where: {
      userId: userId,
      dueDate: { lt: new Date('2024-01-01') }
    }
  })

  for (const todo of expiredTodos) {
    await prisma.todo.delete({ where: { id: todo.id } })
  }

  return NextResponse.json({ success: true })
}
```

---

### 5.3 在前端中删除记忆

```typescript
// 前端代码
async function deleteMemory(key: string) {
  const user = await fetch('/api/users').then(r => r.json())

  const response = await fetch(
    `/api/users/${user.id}/memory/${key}`,
    { method: 'DELETE' }
  )

  if (response.ok) {
    console.log('记忆已删除')
  }
}

// 使用
await deleteMemory('financial-threshold')
```

---

## 6. 最佳实践

### 6.1 在拉齐功能中

✅ **推荐**: 直接使用 AI 工具集
```
用户: "删除这个待办"
AI 自动调用 deleteTodo 工具
```

### 6.2 在服务器端代码中

✅ **推荐**: 使用 `lib/user.ts` 的函数
```typescript
await deleteMemoryEntry(userId, 'key')
```

❌ **不推荐**: 直接写 Prisma 查询（要么使用库函数）

### 6.3 处理删除失败

```typescript
try {
  await deleteMemoryEntry(userId, 'key')
} catch (error) {
  console.error('删除失败:', error)
  // 提供用户反馈
}
```

### 6.4 批量删除时要谨慎

```typescript
// ⚠️ 危险操作 - 清除所有记忆
// 应该只在明确需要时执行
await clearUserMemory(userId)

// 更安全的做法：只删除特定的条目
const keysToDelete = ['old-memo-1', 'old-memo-2']
for (const key of keysToDelete) {
  await deleteMemoryEntry(userId, key)
}
```

---

## 7. 常见问题

**Q: 删除操作是否可以撤销？**
A: 不可以。删除操作是永久的。建议在 UI 中添加确认提示。

**Q: AI 工具集中的 deleteTodo 和 deleteMilestone 支持精确匹配吗？**
A: 支持模糊匹配。工具使用 `contains` 操作进行不区分大小写的搜索，如果有多个匹配项，会删除第一个找到的。

**Q: 删除 Todo 时会影响关联的 Milestone 吗？**
A: 不会。Todo 和 Milestone 是独立的资源，删除 Todo 不会删除关联的 Milestone。

**Q: 长期记忆中嵌套对象的删除**
A: `deleteMemoryEntry` 只删除顶级键。如果需要删除嵌套属性，请使用 `updateUserMemory` 手动处理。

---

## 8. 文件位置参考

| 功能 | 位置 |
|------|------|
| AI 工具集 | `app/api/align/route.ts` (行 214-240, 277-303, 342-368) |
| 后端库函数 | `lib/user.ts` (行 98-119) |
| 内存 API 端点 | `app/api/users/[userId]/memory/[key]/route.ts` (行 68-86) |
| Prisma 模型 | `prisma/schema.prisma` |

