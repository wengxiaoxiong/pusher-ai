import { cookies } from 'next/headers'
import { getOrCreateDefaultUser } from './user'

const USER_COOKIE_NAME = 'user_id'

/**
 * 获取当前请求的用户 ID
 * 如果 Cookie 中不存在用户 ID，则获取或创建默认用户
 */
export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies()
  let userId = cookieStore.get(USER_COOKIE_NAME)?.value

  if (!userId) {
    // 获取或创建默认用户
    const user = await getOrCreateDefaultUser()
    userId = user.id
    // 设置 Cookie (14 天过期)
    cookieStore.set(USER_COOKIE_NAME, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14,
      path: '/',
    })
  }

  return userId
}

/**
 * 在服务器端设置用户 ID Cookie
 */
export async function setUserIdCookie(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(USER_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 14,
    path: '/',
  })
}

/**
 * 清除用户 ID Cookie
 */
export async function clearUserIdCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(USER_COOKIE_NAME)
}
