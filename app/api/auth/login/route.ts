import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/user"
import { verifyPassword } from "@/lib/password"
import { setUserIdCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json({ error: "请填写邮箱和密码" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 })
    }

    await setUserIdCookie(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("login error", error)
    return NextResponse.json({ error: "登录失败，请稍后重试" }, { status: 500 })
  }
}
