/**
 * Onboarding API
 * POST /api/user/onboarding - 保存用户的onboarding数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取认证token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // 验证用户身份
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const {
      jobFunction,
      jobTypes,
      location,
      remoteOpen,
      h1bSponsorship,
    } = body;

    // 验证必填字段
    if (!jobFunction || !Array.isArray(jobTypes) || jobTypes.length === 0) {
      return NextResponse.json(
        { error: 'Job function and job types are required' },
        { status: 400 }
      );
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        hasCompletedOnboarding: true,
        jobFunction,
        jobTypes,
        preferredLocation: location,
        remoteOpen: remoteOpen || false,
        h1bSponsorship: h1bSponsorship || false,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
        jobFunction: updatedUser.jobFunction,
        jobTypes: updatedUser.jobTypes,
        preferredLocation: updatedUser.preferredLocation,
        remoteOpen: updatedUser.remoteOpen,
        h1bSponsorship: updatedUser.h1bSponsorship,
      },
    });
  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


