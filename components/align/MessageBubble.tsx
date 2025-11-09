import { MarkdownRenderer } from "../MarkdownRenderer"
import { ToolCallDisplay } from "./ToolCallDisplay"
import type { AlignMessage } from "@/app/api/align/route"

interface MessageBubbleProps {
  message: AlignMessage
  index: number
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  return (
    <div className="space-y-2">
      {/* 消息气泡 */}
      <div
        className={`flex gap-3 ${
          message.role === "user" ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`max-w-xs px-4 py-2 rounded-lg ${
            message.role === "user"
              ? "bg-blue-500 text-white"
              : "bg-muted text-foreground"
          }`}
        >
          {message.parts.map((part, i) => {
            if (part.type === "text") {
              return (
                <p key={i} className="text-sm whitespace-pre-wrap">
                  {/* {(part as any).text} */}
                  <MarkdownRenderer content={(part as any).text} />
                </p>
              )
            }
            return null
          })}
      </div>
      </div>

      {/* 工具调用详细记录 - 直接在消息下方显示 */}
      {message.role === "assistant" && message.parts && (
        <div className="space-y-2 pl-3">
          {message.parts.map((part, i) => {
            // 检查是否是工具调用（tool-*）
            if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
              const toolType = part.type === "dynamic-tool"
                ? (part as any).toolName?.replace("tool-", "") || ""
                : part.type.replace("tool-", "")

              const input = (part as any).input as Record<string, unknown> || {}
              const output = (part as any).output as string || ""

              if (!toolType) return null

              return (
                <ToolCallDisplay
                  key={i}
                  toolType={toolType}
                  input={input}
                  output={output}
                />
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}
