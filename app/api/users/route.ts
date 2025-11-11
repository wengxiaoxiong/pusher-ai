import { NextResponse } from "next/server"
import { requireCurrentUser } from "@/lib/auth"

// 创建新用户
export async function POST() {
  console.warn("Deprecated /api/users POST called — please use /api/auth/register")
  return NextResponse.json(
    { error: "请通过 /api/auth/register 创建用户" },
    { status: 405 }
  )
}

// 获取默认用户或创建一个
export async function GET() {
  try {
    const user = await requireCurrentUser()
    return NextResponse.json(user)
  } catch (error) {
    console.error("获取用户出错:", error)
    const status = error instanceof Error && error.message === "未登录" ? 401 : 500
    return NextResponse.json(
      { error: status === 401 ? "未登录" : "获取用户失败" },
      { status }
    )
  }
}
