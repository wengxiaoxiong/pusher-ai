import { NextRequest, NextResponse } from "next/server"
import { createUserWithPassword, getUserByEmail } from "@/lib/user"
import { setUserIdCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!name || !email || !password) {
      return NextResponse.json({ error: "请填写姓名、邮箱和密码" }, { status: 400 })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已注册，请直接登录" }, { status: 400 })
    }

    const user = await createUserWithPassword({ name, email, password })
    await setUserIdCookie(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("register error", error)
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 })
  }
}
