# 删除工具快速参考指南

## 快速开始

### 前端删除（推荐）✨

**步骤**：
1. 打开拉齐页面 `/align`
2. Dashboard 右侧找到 **"删除"** 按钮
3. 点击展开删除面板
4. 找到要删除的项目
5. 点击右侧的 🗑️ 按钮
6. 在确认对话框中点击 **"删除"**
7. 完成！项目已删除

**优点**：
- 🎯 直观、快速
- 🔒 删除前确认
- 📱 完整的 UI 界面
- ⚡ 实时反馈

---

### AI 对话删除

**步骤**：
1. 在拉齐页面输入框中输入
2. 自然描述：`"删除 xxx 任务"`
3. AI 会自动识别和执行

**输入示例**：
```
删除制作视频这个任务
把Q4目标里程碑删除了
清掉旧财务记录备忘
```

---

## 三种删除方式

### 方式1：DeleteActions 组件（最简洁）
```typescript
import { DeleteActions } from "@/components/delete-actions"

<DeleteActions
  todos={todos}
  milestones={milestones}
  memos={memos}
  onDelete={() => refreshData()}
/>
```

### 方式2：直接调用删除工具
```typescript
// 删除 Todo
message: "删除任务\"task-name\""

// 删除 Milestone
message: "删除里程碑\"milestone-name\""

// 删除 Memo
message: "删除备忘录\"memo-key\""
```

### 方式3：后端库函数
```typescript
import { deleteMemoryEntry, clearUserMemory } from '@/lib/user'

// 删除单个记忆
await deleteMemoryEntry(userId, 'key')

// 清除所有记忆
await clearUserMemory(userId)
```

---

## 速查表

| 功能 | 位置 | 文件 | 方法 |
|------|------|------|------|
| **Delete UI** | 拉齐页面右侧 | `app/align/page.tsx` | 点击按钮 |
| **DeleteActions 组件** | 任何地方 | `components/delete-actions.tsx` | 导入使用 |
| **AI 工具** | 对话中 | `app/api/align/route.ts` | 自然语言 |
| **后端函数** | 服务器代码 | `lib/user.ts` | 直接调用 |
| **REST API** | HTTP 请求 | `app/api/users/.../memory/` | DELETE 请求 |

---

## 常见任务

### 删除已完成的任务
```
方法1：UI 删除
  1. 点击"删除"按钮
  2. 在"删除待办"列表找到项目
  3. 点击🗑️删除

方法2：AI 对话
  输入："把这个任务删除了"（AI 会识别上下文）
```

### 清理过期里程碑
```
方法1：UI 删除
  1. 点击"删除"按钮
  2. 在"删除里程碑"列表找到项目
  3. 点击🗑️删除

方法2：AI 对话
  输入："删除那个已完成的季度目标"
```

### 删除旧备忘录
```
方法1：UI 删除
  1. 点击"删除"按钮
  2. 在"删除备忘录"列表找到项目
  3. 点击🗑️删除

方法2：AI 对话
  输入："删除旧财务记录备忘"
```

---

## UI 按钮位置

```
┌──────────────────────────────────────────┐
│ 拉齐页面                                 │
├──────────────────────────────────────────┤
│                                          │
│  左侧：对话区域      右侧：Dashboard    │
│                      ┌────────────────┐ │
│                      │[刷新][删除] ←── │ │← 删除按钮
│                      │统计 | 统计 | 统计│ │
│                      │          里程碑  │ │
│                      │           待办   │ │
│                      │           记忆   │ │
│                      │删除面板 (展开时) │ │
│                      │  ✕ 任务1 |     │ │
│                      │  ✕ 任务2 |     │ │
│                      │  ✕ 里程1 |     │ │
│                      │  ✕ 备忘1 |     │ │
│                      └────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

---

## 删除流程

```
用户点击"删除"按钮
    ↓
删除面板展开，显示三个列表：
  • Todos（待办）
  • Milestones（里程碑）
  • Memos（备忘录）
    ↓
用户选择项目，点击🗑️按钮
    ↓
红色确认对话框弹出
  提示："这个操作无法撤销，确定要删除吗？"
    ↓
用户点击"删除"确认
    ↓
DeleteActions → /api/align
  发送：`删除${type}"${name}"`
    ↓
AI 调用相应的删除工具
  • deleteTodo
  • deleteMilestone
  • deleteMemo
    ↓
Prisma 执行 DELETE 操作
    ↓
返回成功消息
    ↓
onDelete 回调触发
  setTimeout(refreshData, 500)
    ↓
Dashboard 自动刷新，项目消失 ✓
```

---

## 关键特性

### ✅ 必须确认删除
- 所有删除都需要在确认对话框中确认
- 防止误删

### ✅ 完整的项目信息显示
- **Todos**：标题、状态、阻塞标记
- **Milestones**：标题、进度条、完成百分比
- **Memos**：键名、内容预览、分类标签

### ✅ 实时禁用状态
- 删除中时所有按钮禁用
- 防止重复删除

### ✅ 自动刷新
- 删除后 500ms 自动刷新数据
- 用户无需手动刷新

### ✅ 删除前后的状态变化
- 删除前：显示项目列表
- 删除中：按钮禁用，加载状态
- 删除后：项目立即从 UI 移除

---

## 删除组件 Props

```typescript
interface DeleteActionsProps {
  todos: Todo[]                              // 待办列表
  milestones: Milestone[]                    // 里程碑列表
  memos: Memo[]                              // 备忘录列表
  onDelete?: (type, name) => void           // 删除完成回调
  disabled?: boolean                         // 禁用状态
}
```

---

## 数据刷新

删除后自动刷新：
```typescript
onDelete={() => {
  // 等待 AI 工具执行完成
  setTimeout(() => loadDashboardData(), 500)
}}
```

手动刷新：
```typescript
// 点击"刷新"按钮刷新 Dashboard
<Button onClick={loadDashboardData}>
  <RefreshCw />
</Button>
```

---

## 故障排除

| 问题 | 解决方案 |
|------|--------|
| 删除按钮灰化 | 等待当前 AI 请求完成 |
| 删除后数据未刷新 | 手动点击"刷新"按钮 |
| 找不到项目 | 确保项目存在于当前用户的数据中 |
| 确认对话框不出现 | 刷新页面或检查浏览器控制台 |

---

## 相关文档

- 📖 **DELETE_TOOLS.md** - 删除工具技术文档（后端）
- 📖 **DELETE_UI_GUIDE.md** - 前端删除功能详细指南
- 📖 **QUICK_START.md** - 项目快速开始指南
- 📖 **USER_SYSTEM.md** - 用户系统完整文档

---

## 文件位置快速链接

```
删除组件：
  components/delete-actions.tsx

拉齐页面：
  app/align/page.tsx

后端工具：
  app/api/align/route.ts

后端函数：
  lib/user.ts

API 端点：
  app/api/users/[userId]/memory/[key]/route.ts
```

---

## 一句话总结

点击 Dashboard 的 **"删除"** 按钮 → 展开删除面板 → 点击项目的 🗑️ → 确认删除 ✓

---

**版本**: 1.0 | **最后更新**: 2024 | **状态**: 完成 ✅

