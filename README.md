我简化一下

# AiPusher系统

用来Push用户完成事情的AiAgent系统

我们定义「拉齐」为：根据用户的自然语言输入来进行总结，然后来管理当前用户的Todo、来管理用户的milestone及其完成度，还有长期记忆memo等
我们定义「追问」为：时根据系统内的todos、milestones、记忆等内容，来生成1-3个问题高效的来询问用户是否有根据自己的节奏和目标在走
每日21:00自动触发一次拉齐，每5个小时
这个自动触发暂时先基于本系统的通知功能来实现，通知的content一般是一个URL，这个URL打开是一个「拉齐」、「追问」的前端组件，后续可能会使用邮件或飞书的方式来触发Agent系统和用户的交互

## 技术栈
- 前端：Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + vercel ai-sdk 
- 后端：Node.js + Prisma + vercel ai-sdk + deepseekadd