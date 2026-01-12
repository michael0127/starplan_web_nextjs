import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, avatarUrl, userType } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const finalUserType = (userType === 'EMPLOYER' ? 'EMPLOYER' : 'CANDIDATE') as 'CANDIDATE' | 'EMPLOYER';

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      // 新用户 - 创建记录
      await prisma.user.create({
        data: {
          id: userId,
          email: email,
          name: name || null,
          avatarUrl: avatarUrl || null,
          userType: finalUserType,
          hasCompletedOnboarding: false,
        }
      });

      console.log(`Created new user via Google OAuth: ${email}, type: ${finalUserType}`);

      // 新用户重定向到 onboarding 或 employer dashboard
      const redirectTo = finalUserType === 'EMPLOYER' ? '/employer/dashboard' : '/onboarding';
      return NextResponse.json({ success: true, redirectTo, isNewUser: true });
    }

    // 已存在的用户
    if (existingUser.hasCompletedOnboarding) {
      // 已完成 onboarding，根据用户类型跳转
      const redirectTo = existingUser.userType === 'EMPLOYER' 
        ? '/employer/dashboard' 
        : '/explore';
      return NextResponse.json({ success: true, redirectTo, isNewUser: false });
    }

    // 未完成 onboarding 的用户 - 更新信息
    const updates: Record<string, unknown> = {};

    // 如果用户选择了 EMPLOYER 类型，更新它
    if (finalUserType === 'EMPLOYER' && existingUser.userType !== 'EMPLOYER') {
      updates.userType = 'EMPLOYER';
    }

    // 更新头像（如果有）
    if (!existingUser.avatarUrl && avatarUrl) {
      updates.avatarUrl = avatarUrl;
    }

    // 更新名字（如果有）
    if (!existingUser.name && name) {
      updates.name = name;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updates
      });
      console.log(`Updated user via Google OAuth: ${email}, updates:`, updates);
    }

    // 根据最终的用户类型确定重定向
    const currentUserType = updates.userType || existingUser.userType;
    const redirectTo = currentUserType === 'EMPLOYER' ? '/employer/dashboard' : '/onboarding';
    
    return NextResponse.json({ success: true, redirectTo, isNewUser: false });

  } catch (error) {
    console.error('OAuth complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
