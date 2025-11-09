import { NextRequest, NextResponse } from 'next/server'
import {
  createUser,
  getOrCreateDefaultUser,
} from '@/lib/user'

// 创建新用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email } = body

    if (!name) {
      return NextResponse.json(
        { error: '用户名不能为空' },
        { status: 400 }
      )
    }

    const user = await createUser({ name, email })
    return NextResponse.json(user)
  } catch (error) {
    console.error('创建用户出错:', error)
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    )
  }
}

// 获取默认用户或创建一个
export async function GET() {
  try {
    const user = await getOrCreateDefaultUser()
    return NextResponse.json(user)
  } catch (error) {
    console.error('获取用户出错:', error)
    return NextResponse.json(
      { error: '获取用户失败' },
      { status: 500 }
    )
  }
}
