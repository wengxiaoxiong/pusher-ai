# AiPusher 系统设计文档

## 一、系统核心概念

### 1.1 「拉齐」(Align)
**定义**：将用户的自然语言输入结构化，并更新系统状态

**输入**：
- 自由文本（用户日报、事项记录）

**处理**：
- NLP 解析：提取事件、成就、障碍、决策信息
- 状态更新：
  - ✅ 完成的 Todo
  - 🔄 进行中的 Milestone 进度
  - 💾 新增/更新的长期记忆 Memo
  - ⚠️ 识别的风险信号

**输出**：
```json
{
  "parsed": {
    "achievements": ["成就1", "成就2"],
    "blockers": ["障碍1"],
    "decisions": ["决策1"]
  },
  "updates": {
    "completed_todos": ["todo_id_1"],
    "milestone_progress": [{"id": "m_1", "progress": 75}],
    "new_memos": [{"key": "...", "content": "..."}]
  },
  "signals": {
    "risks": ["风险信号"],
    "context_changes": ["上下文变化"]
  }
}
```

**核心问题**：
- 如何从自然语言准确提取结构化信息？
- 模糊的进度描述怎么映射到 Milestone？
- 一个输入涉及多个 Milestone 时如何处理？

---

### 1.2 「追问」(Inquiry)
**定义**：基于系统状态生成高效的探询问题

**触发条件**：
- 定时触发（每 5 小时一次）
- 手动触发

**生成逻辑**：
```
根据 {todos, milestones, memos} 生成 1-3 个问题

问题的优先级：
1. 关键路径上的风险
   - Deadline 接近但进度落后的 Milestone
   - 被标记为 Blocker 的 Todo
   
2. 上次「追问」后的响应状态
   - 用户承诺的事情完成了吗？
   - 新增了哪些变数？
   
3. 周期性检查
   - 长期目标的对齐度检查
   - 财务/个人状态的常规问询
```

**问题设计原则**：
- ❌ 不要问"你今天做了什么"（这是拉齐的活）
- ✅ 问"这个方向对吗"、"你是否卡住了"
- 问题应该 **可回答性强**：用户能在 1-2 分钟内给出答案

**输出示例**：
```json
{
  "inquiries": [
    {
      "question": "PitchLab 的 7 天 3 集计划进度如何？按现在的节奏能完成吗？",
      "context": "上次说需要 8 小时/集，已完成 1 集",
      "priority": 1
    },
    {
      "question": "账户余额 ¥X，你觉得还能支撑多久的生活？",
      "context": "财务系统",
      "priority": 2
    }
  ]
}
```

---

### 1.3 时间触发规则

```
每日 21:00 → 拉齐（晚间日报）
  ↓ 基于拉齐结果
  ↓ 立即或延迟到 21:30 → 追问（晚间检查）

每 5 小时 → 追问（定期检查）
  - 06:00, 11:00, 16:00, 21:00, 02:00 (次日)
  - 或者更灵活：基于时区和用户习惯
```

**问题**：
- 一天会触发多少次交互？需要考虑用户的"疲劳度"
- 5 小时的间隔是固定的还是自适应的？

---

## 二、数据模型

### 2.1 核心数据表

```prisma
// 用户
model User {
  id String @id
  name String
  created_at DateTime
  config Config?
}

// 用户配置
model Config {
  user_id String @unique
  align_time String @default("21:00")        // 拉齐触发时间
  inquiry_interval Int @default(300)         // 追问间隔（分钟）
  timezone String @default("Asia/Shanghai")
  // 其他个性化设置
}

// Todo 项
model Todo {
  id String @id
  user_id String
  title String
  description String?
  status TodoStatus @default(ACTIVE)  // ACTIVE, COMPLETED, ARCHIVED
  priority Int                         // 1-5
  created_at DateTime
  completed_at DateTime?
  related_milestone_id String?
  
  // 来源追踪
  created_by CreationSource  // ALIGN, MANUAL_INPUT, SYSTEM_GENERATED
  memo_references String[]   // 关联的 Memo IDs
}

enum TodoStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum CreationSource {
  ALIGN
  MANUAL_INPUT
  SYSTEM_GENERATED
}

// Milestone（里程碑）
model Milestone {
  id String @id
  user_id String
  title String
  description String?
  target_completion DateTime
  progress Int @default(0)    // 0-100
  status MilestoneStatus      // ACTIVE, AT_RISK, COMPLETED, ARCHIVED
  created_at DateTime
  
  // 关键信息
  key_results String[]        // JSON 存储 KR
  blockers String[]           // 当前障碍
  last_update DateTime        // 上次更新时间
}

enum MilestoneStatus {
  ACTIVE
  AT_RISK
  COMPLETED
  ARCHIVED
}

// 长期记忆 Memo
model Memo {
  id String @id
  user_id String
  key String              // 记忆的标签（如 "financial_status", "learning_goal"）
  content String          // 实际内容
  category String         // "financial", "personal", "goal", "context"
  last_updated DateTime
  created_at DateTime
  
  // 关联信息
  related_todos String[]
  related_milestones String[]
}

// 交互记录
model Interaction {
  id String @id
  user_id String
  type InteractionType    // ALIGN, INQUIRY
  triggered_at DateTime
  
  // 拉齐数据
  align_data AlignResult?
  
  // 追问数据
  inquiry_data InquiryResult?
  
  // 用户响应
  user_response String?
  response_at DateTime?
  
  // Agent 的后续处理
  followup_actions String[]  // JSON
}

enum InteractionType {
  ALIGN
  INQUIRY
}
```

### 2.2 数据关系图

```
User
├── Config
├── Todo[]
│   ├── related_milestone_id → Milestone
│   └── memo_references → Memo[]
├── Milestone[]
│   ├── blockers (from Align)
│   └── related todos (inverse)
├── Memo[]
│   ├── related_todos
│   └── related_milestones
└── Interaction[]
    ├── align_data
    └── inquiry_data
```

---

## 三、Agent 处理流程

### 3.1 「拉齐」处理链

```
1. 接收用户输入
   ↓
2. 预处理
   - 清理文本
   - 识别关键实体（项目名、时间、数字）
   
3. NLP 分析（DeepSeek）
   Prompt: 将用户的日报结构化为 JSON
   {
     "achievements": [],
     "blockers": [],
     "decisions": [],
     "metrics": {},
     "context_changes": []
   }
   
4. 智能匹配
   - 识别提到的 Milestone/Todo
   - 解析进度数字或相对描述
   - 更新对应的数据库记录
   
5. 风险检测
   - 是否有延期风险？
   - 是否有新的 Blocker？
   - 是否有目标冲突？
   
6. 生成总结
   - "你今天完成了 3 个 Todo，PitchLab 进度推进到 60%"
   - 识别出 1 个新 Blocker：「缺少 UI 设计素材」
   
7. 返回给前端
   {
     "summary": "...",
     "updates": {...},
     "warnings": [...]
   }
```

### 3.2 「追问」处理链

```
1. 收集当前状态
   - 所有 ACTIVE 的 Todo（按优先级）
   - 所有 ACTIVE 的 Milestone（按截止日期）
   - 所有关键 Memo
   
2. 风险评分
   为每个 Milestone 计算：
   risk_score = (1 - progress/target) * deadline_urgency * importance
   
3. 问题生成
   a) 关键路径问题
      - 最高风险的 Milestone：1 个直指性问题
   
   b) 状态检查问题
      - 上次「拉齐」后有什么变化吗？
      - 新发现的 Blocker 有缓解吗？
   
   c) 上下文问题
      - 长期目标检查（周期性）
      - 个人状态检查（周期性）
   
4. 问题排序
   - Priority 1: 关键路径 + 立即可行
   - Priority 2: 次要决策
   - Priority 3: 定期检查
   
5. 筛选 1-3 个最重要的问题
   
6. 返回给前端
```

---

## 四、前端交互流程

### 4.1 拉齐组件

```
输入区
├─ 文本框（自由输入或粘贴日报）
├─ 快速标签（可选：项目选择器、情绪评分等）
└─ 提交按钮

处理区
├─ Loading 动画
└─ 流式显示 Agent 的理解过程

结果区
├─ 总结卡片
│  └─ "你今天完成了..."
├─ 更新卡片
│  ├─ ✅ 完成的 Todo
│  ├─ 📈 Milestone 进度变化
│  └─ 💾 新增/更新的 Memo
└─ 预警卡片
   ├─ ⚠️ 风险信号
   └─ 💡 建议行动

确认 / 修改
├─ 确认所有更新
├─ 手动调整（如果 AI 理解有误）
└─ 保存
```

### 4.2 追问组件

```
问卷区
├─ 问题 1
│  └─ 输入框 / 选择器 / 滑块（根据问题类型）
├─ 问题 2
│  └─ ...
└─ 问题 3（如果有）

辅助信息
├─ 上下文卡片（为什么问这个问题？）
└─ 历史数据（之前的相关回答）

提交区
├─ 提交答案
└─ 跳过（可选）

后续反馈
├─ Agent 的即时处理反馈
└─ "我理解了，PitchLab 的风险降低了"
```

---

## 五、关键设计问题

### Q1: 拉齐的准确度问题
**场景**：用户说"做了两个视频脚本"

可能的理解歧义：
- 是 PitchLab 的脚本吗？还是个人品牌内容的脚本？
- 是完成状态还是进行中？
- 占用了多少时间？

**解决方案**：
- 拉齐后让用户确认理解是否正确
- 维护「项目映射表」（用户提到的名词 → Milestone 的标准化）
- 在追问时进一步澄清

### Q2: 追问的「打扰度」
**问题**：每 5 小时一次追问 = 一天接近 5 次

**可能的方案**：
a) 自适应间隔
   - 用户活跃时缩短间隔
   - 用户非活跃时延长
   - 基于风险等级调整

b) 分布式触发
   - 只在固定时段（如工作时间、晚上）
   - 非工作时间不打扰

c) 优先级队列
   - 一次最多 1-2 个高优先级问题
   - 低优先级推迟到周总结

### Q3: Memo 的管理
**问题**：长期记忆如何有效使用？

**设计**：
- Memo 应该是 **面向决策的**，而不是日志式的
- 例如：
  ```
  key: "pitchlab_user_retention_blocker"
  content: "用户完成一次后流失，可能原因：缺乏重复使用价值"
  category: "goal"
  ```
- Memo 应该在每次「追问」时被审视（是否还相关？是否已解决？）

### Q4: 通知的实现
**当前方案**：系统内通知 → URL 打开组件

**未来扩展**：
- 邮件：标题是「追问」，内容包含链接
- 飞书：消息卡片，支持快速回复
- 短信：超高优先级事项

**技术实现**：
- 通知应该包含：
  - action_id（用于跟踪）
  - deep_link（打开特定的拉齐/追问组件）
  - preview（摘要）

### Q5: 数据的时间维度
**问题**：系统需要理解"进度"的时间变化

**设计**：
```
Milestone {
  progress: 60,
  progress_history: [
    {date: "2025-11-07", value: 40},
    {date: "2025-11-08", value: 60}
  ],
  velocity: 20%/day  // 平均进度速度
}
```

这样可以：
- 预测截止日期
- 识别进度异常（突然停滞）
- 给出更准确的建议

---

## 六、实现优先级

### Phase 1: MVP
- ✅ 拉齐基础版（NLP + 更新状态）
- ✅ 追问基础版（基于优先级生成问题）
- ✅ 简单的定时触发（使用 cron）
- ✅ 前端组件（输入、显示结果）
- 数据库：User, Todo, Milestone, Interaction

### Phase 2: 增强
- 追问的自适应（风险评分）
- Memo 系统完善
- 拉齐的手动确认界面
- 交互历史查看

### Phase 3: 集成
- 邮件通知
- 飞书集成
- 数据可视化看板
- 周/月总结生成

---

## 七、技术选型备注

### DeepSeek 的使用
- 拉齐：使用 structured output（JSON mode）
- 追问：使用流式生成（为了显示思考过程）

### 前端动画 / 交互
- 流式显示 Agent 的 Token
- 确认/修改的交互需要平滑

### 存储
- 交互历史应该完整保存（用于学习用户模式）
- 考虑定期备份