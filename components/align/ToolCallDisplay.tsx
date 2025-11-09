import { cn } from "@/lib/utils"
import { toolIcons } from "@/lib/toolsConfig"

interface ToolCallDisplayProps {
  toolType: string
  input: Record<string, unknown>
  output: string
}

/**
 * 根据工具类型渲染对应的工具调用详情
 */
function renderToolDetails(toolType: string, input: Record<string, unknown>, output: string) {
  const commonOutput = output && <p className="text-muted-foreground">✓ {output}</p>

  switch (toolType) {
    // 查询工具
    case "queryTodos":
    case "queryMilestones":
    case "queryMemos":
      return <p className="text-muted-foreground whitespace-pre-wrap">{output}</p>

    // 标记任务完成
    case "markTodoComplete":
      return (
        <div>
          <p>
            <span className="font-medium">任务:</span> {String(input.todoTitle || "")}
          </p>
          {commonOutput}
        </div>
      )

    // 更新里程碑进度
    case "updateMilestoneProgress":
      return (
        <div>
          <p>
            <span className="font-medium">里程碑:</span> {String(input.milestoneName || "")}
          </p>
          <p>
            <span className="font-medium">进度:</span> {String(input.progress || "0")}%
          </p>
          {commonOutput}
        </div>
      )

    // 保存备忘录
    case "saveMemo":
      return (
        <div>
          <p>
            <span className="font-medium">标签:</span> {String(input.key || "")}
          </p>
          <p>
            <span className="font-medium">内容:</span>{" "}
            {String(input.content || "").substring(0, 80)}
            {String(input.content || "").length > 80 ? "..." : ""}
          </p>
          {input.category ? (
            <p>
              <span className="font-medium">分类:</span> {String(input.category)}
            </p>
          ) : null}
          {commonOutput}
        </div>
      )

    // 保存交互
    case "saveInteraction":
      return <p className="text-muted-foreground">✓ 交互记录已保存</p>

    // 添加任务
    case "addTodo":
      return (
        <div>
          <p>
            <span className="font-medium">任务:</span> {String(input.title || "")}
          </p>
          {(input.isBlocker as boolean) && (
            <p className="text-red-500 font-medium">⚠️ 阻塞性任务</p>
          )}
          {commonOutput}
        </div>
      )

    // 删除任务
    case "deleteTodo":
      return (
        <div>
          <p>
            <span className="font-medium">任务:</span> {String(input.todoTitle || "")}
          </p>
          {commonOutput}
        </div>
      )

    // 添加里程碑
    case "addMilestone":
      return (
        <div>
          <p>
            <span className="font-medium">里程碑:</span> {String(input.title || "")}
          </p>
          {(input.target as string | undefined) && (
            <p>
              <span className="font-medium">目标:</span> {String(input.target)}
            </p>
          )}
          {commonOutput}
        </div>
      )

    // 删除里程碑
    case "deleteMilestone":
      return (
        <div>
          <p>
            <span className="font-medium">里程碑:</span> {String(input.milestoneName || "")}
          </p>
          {commonOutput}
        </div>
      )

    // 分析计划并建议待办
    case "analyzePlanAndSuggestTodos":
      return (
        <div>
          <p>
            <span className="font-medium">文本:</span> {String(input.text || "").substring(0, 60)}
            {String(input.text || "").length > 60 ? "..." : ""}
          </p>
          {commonOutput}
        </div>
      )

    default:
      return <p className="text-muted-foreground">工具调用已执行</p>
  }
}

export function ToolCallDisplay({ toolType, input, output }: ToolCallDisplayProps) {
  const toolInfo = toolIcons[`tool-${toolType}`]

  return (
    <div
      className={cn(
        "rounded-lg p-3 border-l-4 text-xs",
        toolInfo?.color || "bg-gray-100",
        "border-l-gray-300"
      )}
    >
      {/* 工具标题 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{toolInfo?.icon}</span>
        <span className="font-semibold">{toolInfo?.label}</span>
      </div>

      {/* 工具详情 */}
      <div className="space-y-1 text-xs">{renderToolDetails(toolType, input, output)}</div>
    </div>
  )
}
