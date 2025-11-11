import { NextResponse } from "next/server"
import { clearUserIdCookie } from "@/lib/auth"

export async function POST() {
  try {
    await clearUserIdCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("logout error", error)
    return NextResponse.json({ error: "退出登录失败" }, { status: 500 })
  }
}
