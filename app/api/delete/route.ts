import { deleteTodo } from "@/lib/tools/todo"
import { deleteMilestone } from "@/lib/tools/milestone"
import { deleteMemo } from "@/lib/tools/memo"

export async function POST(req: Request) {
  try {
    const { type, name } = await req.json()

    if (!type || !name) {
      return new Response(
        JSON.stringify({ error: "Missing type or name parameter" }),
        { status: 400 }
      )
    }

    let result = ""

    switch (type) {
      case "todo":
        result = await deleteTodo.execute({ todoTitle: name })
        break
      case "milestone":
        result = await deleteMilestone.execute({ milestoneName: name })
        break
      case "memo":
        result = await deleteMemo.execute({ memoKey: name })
        break
      default:
        return new Response(
          JSON.stringify({ error: "Invalid type" }),
          { status: 400 }
        )
    }

    // 检查是否删除成功（工具函数返回"未找到"表示失败）
    const isSuccess = !result.includes("未找到")

    return new Response(
      JSON.stringify({ success: isSuccess, message: result }),
      { status: isSuccess ? 200 : 404 }
    )
  } catch (error) {
    console.error("Delete API error:", error)
    const isAuthError = error instanceof Error && /未登录|未找到用户/.test(error.message)
    return new Response(
      JSON.stringify({ error: isAuthError ? "未登录" : "Failed to delete item" }),
      { status: isAuthError ? 401 : 500 }
    )
  }
}
