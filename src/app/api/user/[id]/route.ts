/**
 * User API 路由
 * GET /api/user/[id] - 获取用户信息
 * PATCH /api/user/[id] - 更新用户信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/user';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/user/[id]
 * 获取用户信息
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/[id]
 * 更新用户信息
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // 验证请求体
    const { name, avatarUrl } = body;

    if (!name && !avatarUrl) {
      return NextResponse.json(
        { error: 'At least one field (name or avatarUrl) must be provided' },
        { status: 400 }
      );
    }

    // TODO: 添加用户身份验证
    // 确保只有用户自己才能更新自己的信息
    // 可以使用 Supabase Auth 来验证

    const updatedUser = await updateUser(id, {
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}









