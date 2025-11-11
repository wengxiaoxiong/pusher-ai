# 用户系统文档

## 概述

这个用户系统提供了完整的用户管理和长期记忆存储功能，支持创建用户、管理用户信息和长期记忆。

## 核心特性

1. **用户管理**：创建、查询、更新用户信息
2. **长期记忆存储**：在用户字段中以 JSON 格式存储长期记忆
3. **自动认证**：使用 Cookie 自动识别用户，无需每次传递用户 ID
4. **灵活的记忆管理**：支持批量更新、单条更新、删除等操作

## API 端点

### 用户管理

#### 登录 / 注册

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

**注册请求体：**
```json
{
  "name": "用户名",
  "email": "邮箱",
  "password": "至少 6 位的密码"
}
```

**登录请求体：**
```json
{
  "email": "邮箱",
  "password": "密码"
}
```

成功登录或注册后，系统会在 Cookie 中写入 `user_id`，随后即可访问其余 API。

#### 获取当前登录用户
```
GET /api/users
```

返回当前 Cookie 中记录的用户信息；未登录将返回 401。

#### 获取用户信息
```
GET /api/users/{userId}
```

#### 更新用户信息
```
PUT /api/users/{userId}
```

**请求体：**
```json
{
  "name": "新用户名",
  "email": "新邮箱"
}
```

### 长期记忆管理

#### 获取所有长期记忆
```
GET /api/users/{userId}/memory
```

**响应：**
```json
{
  "memoryKey1": "value1",
  "memoryKey2": { "nested": "value" },
  ...
}
```

#### 批量更新长期记忆
```
PUT /api/users/{userId}/memory
```

**请求体：**
```json
{
  "goals": ["目标1", "目标2"],
  "preferences": { "theme": "dark" },
  "lastReviewDate": "2024-11-09"
}
```

#### 清除所有长期记忆
```
DELETE /api/users/{userId}/memory
```

#### 获取单个记忆条目
```
GET /api/users/{userId}/memory/{key}
```

#### 创建或更新单个记忆条目
```
POST /api/users/{userId}/memory/{key}
```

**请求体：**
```json
{
  "value": "记忆内容，可以是字符串、对象、数组等任何 JSON 可序列化的值"
}
```

#### 删除单个记忆条目
```
DELETE /api/users/{userId}/memory/{key}
```

## 使用示例

### 后端使用

#### 在服务器函数中使用

```typescript
import { getCurrentUserId } from '@/lib/auth'
import { addMemoryEntry, getUserMemory, updateUserMemory } from '@/lib/user'

// 获取当前用户 ID（自动从 Cookie）
const userId = await getCurrentUserId()

// 添加单个记忆条目
await addMemoryEntry(userId, 'preferences', {
  theme: 'dark',
  language: 'zh-CN'
})

// 获取用户的长期记忆
const memory = await getUserMemory(userId)
console.log(memory)

// 批量更新记忆
await updateUserMemory(userId, {
  goals: ['完成项目 A', '学习 TypeScript'],
  context: '用户背景信息'
})
```

#### 在 API 路由中使用

```typescript
import { getCurrentUserId } from '@/lib/auth'
import { addMemoryEntry } from '@/lib/user'

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  const body = await request.json()

  // 保存用户提交的信息到长期记忆
  await addMemoryEntry(userId, 'userSubmission', body)

  return NextResponse.json({ success: true })
}
```

### 前端使用

#### 在客户端中使用

```typescript
// 获取当前用户信息
const response = await fetch('/api/users')
const user = await response.json()

// 获取用户长期记忆
const memoryResponse = await fetch(`/api/users/${user.id}/memory`)
const memory = await memoryResponse.json()

// 添加新的记忆条目
await fetch(`/api/users/${user.id}/memory/goals`, {
  method: 'POST',
  body: JSON.stringify({
    value: ['完成项目', '学习新技术']
  })
})

// 更新单个记忆条目
await fetch(`/api/users/${user.id}/memory/preferences`, {
  method: 'POST',
  body: JSON.stringify({
    value: { theme: 'light', notifications: true }
  })
})

// 删除记忆条目
await fetch(`/api/users/${user.id}/memory/oldKey`, {
  method: 'DELETE'
})
```

## 数据库架构

### User 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 (cuid) |
| name | String | 用户名 |
| email | String | 邮箱 (唯一) |
| longTermMemory | Json | 长期记忆 JSON 数据 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

## 认证系统

系统使用 Cookie 进行用户识别，无需手动传递用户 ID：

- **Cookie 名称**：`user_id`
- **过期时间**：14 天
- **安全性**：仅在 HTTPS（生产环境）、HttpOnly、SameSite=Lax

## 长期记忆最佳实践

1. **结构化存储**：将相关的信息分组存储
   ```typescript
   {
     "userProfile": { name: "...", avatar: "..." },
     "goals": ["...", "..."],
     "preferences": { theme: "...", language: "..." },
     "context": "用户背景信息",
     "interactions": [...]
   }
   ```

2. **定期更新**：在拉齐和追问等交互后更新记忆

3. **分类管理**：使用有意义的键名组织信息

4. **版本控制**：如果需要保留历史，可以将旧数据存档

## 集成指南

### 在现有功能中集成

例如，在"拉齐"功能中集成长期记忆：

```typescript
import { getCurrentUserId } from '@/lib/auth'
import { getUserMemory, updateUserMemory } from '@/lib/user'

export async function align(input: string) {
  const userId = await getCurrentUserId()

  // 获取用户的长期记忆作为上下文
  const memory = await getUserMemory(userId)

  // 使用 AI 处理输入和记忆
  const response = await generateAlign(input, memory)

  // 更新长期记忆
  await updateUserMemory(userId, {
    lastAlign: new Date().toISOString(),
    alignHistory: [response, ...(memory.alignHistory || [])]
  })

  return response
}
```

## 常见问题

### Q: 如何在没有用户 ID 的情况下操作？
A: 在服务器端使用 `getCurrentUserId()` 函数，它会读取登录时写入的 Cookie；若未登录会抛出错误，需要先完成邮箱+密码登录。

### Q: 长期记忆有大小限制吗？
A: PostgreSQL JSON 字段没有严格限制，但建议将单个条目保持在合理范围内（< 1MB）。

### Q: 如何导出用户的长期记忆？
A: 调用 `GET /api/users/{userId}/memory` 获取 JSON，然后可以保存为文件或导出为其他格式。

### Q: 可以为多个用户创建独立的记忆空间吗？
A: 可以。每个用户都有独立的 longTermMemory 字段，隔离存储。

## 迁移日志

- **2024-11-09**: 初始版本，添加 longTermMemory 字段到 User 模型
