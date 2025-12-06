/**
 * Users API 路由
 * GET /api/users - 获取用户列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUserStats, searchUsers } from '@/lib/user';

/**
 * GET /api/users
 * 获取用户列表或搜索用户
 * 查询参数：
 * - q: 搜索关键词（可选）
 * - stats: 是否返回统计信息（可选，值为 'true'）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const showStats = searchParams.get('stats') === 'true';

    // 如果请求统计信息
    if (showStats) {
      const stats = await getUserStats();
      return NextResponse.json(stats);
    }

    // 如果有搜索关键词
    if (query) {
      const users = await searchUsers(query);
      return NextResponse.json({ users, count: users.length });
    }

    // 默认返回所有用户
    const users = await getAllUsers();
    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}









