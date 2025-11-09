import { NextRequest, NextResponse } from 'next/server'
import {
  getUserMemory,
  addMemoryEntry,
  deleteMemoryEntry,
} from '@/lib/user'

// 获取单个记忆条目
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; key: string }> }
) {
  try {
    const { userId, key } = await params
    const memory = await getUserMemory(userId)
    const value = memory[key as keyof typeof memory]

    if (value === undefined) {
      return NextResponse.json(
        { error: '记忆条目不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ key, value })
  } catch (error) {
    console.error('获取记忆条目出错:', error)
    return NextResponse.json(
      { error: '获取记忆条目失败' },
      { status: 500 }
    )
  }
}

// 创建或更新单个记忆条目
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; key: string }> }
) {
  try {
    const { userId, key } = await params
    const body = await request.json()
    const { value } = body

    if (value === undefined) {
      return NextResponse.json(
        { error: '记忆内容不能为空' },
        { status: 400 }
      )
    }

    await addMemoryEntry(userId, key, value)
    return NextResponse.json({
      message: '记忆条目已保存',
      key,
      value,
    })
  } catch (error) {
    console.error('保存记忆条目出错:', error)
    return NextResponse.json(
      { error: '保存记忆条目失败' },
      { status: 500 }
    )
  }
}

// 删除单个记忆条目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; key: string }> }
) {
  try {
    const { userId, key } = await params
    await deleteMemoryEntry(userId, key)
    return NextResponse.json({
      message: '记忆条目已删除',
      key,
    })
  } catch (error) {
    console.error('删除记忆条目出错:', error)
    return NextResponse.json(
      { error: '删除记忆条目失败' },
      { status: 500 }
    )
  }
}
