import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, userType, name, avatarUrl } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const finalUserType = (userType === 'EMPLOYER' ? 'EMPLOYER' : 'CANDIDATE') as 'CANDIDATE' | 'EMPLOYER';

    // 检查用户是否存在（包含公司信息）
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!existingUser) {
      // 创建新用户
      // EMPLOYER 不需要做 onboarding，直接标记为完成
      await prisma.user.create({
        data: {
          id: userId,
          email,
          name: name || null,
          avatarUrl: avatarUrl || null,
          userType: finalUserType,
          hasCompletedOnboarding: finalUserType === 'EMPLOYER',
        }
      });
      
      console.log(`Created new OAuth user: ${email}, type: ${finalUserType}`);
      
      // 新注册的 employer 跳转到 settings 页面完善公司信息
      return NextResponse.json({
        success: true,
        action: 'created',
        userType: finalUserType,
        redirectTo: finalUserType === 'EMPLOYER' ? '/employer/settings' : '/onboarding'
      });
    } else {
      // 用户已存在，可能需要更新
      const updates: Record<string, unknown> = {};
      
      // 如果用户选择了 EMPLOYER 类型，更新它
      if (finalUserType === 'EMPLOYER' && existingUser.userType !== 'EMPLOYER') {
        updates.userType = 'EMPLOYER';
        updates.hasCompletedOnboarding = true;
      }
      
      // 更新头像（如果有且之前没有）
      if (!existingUser.avatarUrl && avatarUrl) {
        updates.avatarUrl = avatarUrl;
      }
      
      // 更新名字（如果有且之前没有）
      if (!existingUser.name && name) {
        updates.name = name;
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: updates
        });
        console.log(`Updated OAuth user: ${email}, updates:`, updates);
      }
      
      // 确定重定向 URL
      let redirectTo = '/onboarding';
      const isEmployer = existingUser.userType === 'EMPLOYER' || updates.userType === 'EMPLOYER';
      if (isEmployer) {
        // 检查是否已完善公司信息
        if (!existingUser.company || !existingUser.company.companyName) {
          redirectTo = '/employer/settings';
        } else {
          redirectTo = '/employer/dashboard';
        }
      } else if (existingUser.hasCompletedOnboarding) {
        redirectTo = '/explore';
      }
      
      return NextResponse.json({
        success: true,
        action: 'updated',
        userType: (updates.userType as string) || existingUser.userType,
        redirectTo
      });
    }
  } catch (error) {
    console.error('OAuth user setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
