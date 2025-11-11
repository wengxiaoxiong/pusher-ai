import { cookies } from "next/headers"
import { getUser } from "./user"

const USER_COOKIE_NAME = "user_id"

/**
 * 获取当前请求的用户 ID，如果不存在则抛出错误
 */
export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies()
  const userId = cookieStore.get(USER_COOKIE_NAME)?.value

  if (!userId) {
    throw new Error("未登录")
  }

  return userId
}

export async function requireCurrentUser() {
  const userId = await getCurrentUserId()
  const user = await getUser(userId)

  if (!user) {
    throw new Error("未找到用户")
  }

  return user
}

/**
 * 在服务器端设置用户 ID Cookie
 */
export async function setUserIdCookie(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(USER_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
  })
}

/**
 * 清除用户 ID Cookie
 */
export async function clearUserIdCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(USER_COOKIE_NAME)
}
