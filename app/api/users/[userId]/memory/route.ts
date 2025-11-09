import { NextRequest, NextResponse } from 'next/server'
import {
  getUserMemory,
  updateUserMemory,
  addMemoryEntry,
  deleteMemoryEntry,
  clearUserMemory,
} from '@/lib/user'

// 获取用户的长期记忆
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const memory = await getUserMemory(userId)
    return NextResponse.json(memory)
  } catch (error) {
    console.error('获取用户长期记忆出错:', error)
    return NextResponse.json(
      { error: '获取长期记忆失败' },
      { status: 500 }
    )
  }
}

// 更新用户长期记忆 (批量更新)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = await request.json()

    const user = await updateUserMemory(userId, body)
    return NextResponse.json({
      message: '长期记忆更新成功',
      memory: user.longTermMemory,
    })
  } catch (error) {
    console.error('更新用户长期记忆出错:', error)
    return NextResponse.json(
      { error: '更新长期记忆失败' },
      { status: 500 }
    )
  }
}

// 清除所有长期记忆
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const user = await clearUserMemory(userId)
    return NextResponse.json({
      message: '长期记忆已清除',
      memory: user.longTermMemory,
    })
  } catch (error) {
    console.error('清除用户长期记忆出错:', error)
    return NextResponse.json(
      { error: '清除长期记忆失败' },
      { status: 500 }
    )
  }
}
