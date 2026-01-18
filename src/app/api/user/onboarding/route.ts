/**
 * Onboarding API
 * POST /api/user/onboarding - 保存用户的onboarding数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * 触发自动匹配（使用 Celery 异步任务接口）
 * 返回任务 ID，匹配会在后台执行
 */
async function triggerAutoMatching(candidateId: string): Promise<string | null> {
  try {
    // 使用 Celery 异步任务接口
    const response = await fetch(`${BACKEND_URL}/api/v1/tasks/matching/candidate-to-all-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate_id: candidateId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Auto-matching task submission failed:', error);
      return null;
    }

    const result = await response.json();
    console.log(`✅ Auto-matching task submitted for candidate ${candidateId}:`, {
      task_id: result.task_id,
      status: result.status,
    });
    
    return result.task_id;
  } catch (error) {
    console.error('Auto-matching request error:', error);
    return null;
  }
}

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
      // New fields
      categories,
      categorySkills,
      experienceLevel,
      experienceYearsFrom,
      experienceYearsTo,
      workTypes,
      remoteOpen,
      payType,
      currency,
      salaryExpectationFrom,
      salaryExpectationTo,
      workAuthCountries,
      workAuthByCountry,
      // Legacy fields
      jobTypes,
      location,
    } = body;

    // 验证必填字段
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'At least one job category is required' },
        { status: 400 }
      );
    }

    if (!workTypes || !Array.isArray(workTypes) || workTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one work type is required' },
        { status: 400 }
      );
    }

    if (!workAuthCountries || !Array.isArray(workAuthCountries) || workAuthCountries.length === 0) {
      return NextResponse.json(
        { error: 'Work authorization information is required' },
        { status: 400 }
      );
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        hasCompletedOnboarding: true,
        // New onboarding fields
        categories: categories || [],
        categorySkills: categorySkills || [],
        experienceLevel: experienceLevel || null,
        experienceYearsFrom: experienceYearsFrom ? parseInt(experienceYearsFrom.toString()) : null,
        experienceYearsTo: experienceYearsTo ? experienceYearsTo.toString() : null,
        workTypes: workTypes || [],
        remoteOpen: remoteOpen || false,
        payType: payType || null,
        currency: currency || null,
        salaryExpectationFrom: salaryExpectationFrom || null,
        salaryExpectationTo: salaryExpectationTo || null,
        workAuthCountries: workAuthCountries || [],
        workAuthByCountry: workAuthByCountry || {},
        // Legacy fields for backward compatibility
        jobTypes: jobTypes || workTypes || [],
        preferredLocation: location || null,
      },
    });

    // 触发自动匹配（异步，不阻塞响应）
    triggerAutoMatching(user.id).catch(error => {
      console.error('Auto-matching error:', error);
      // 不影响 onboarding 的成功响应
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
        categories: updatedUser.categories,
        categorySkills: updatedUser.categorySkills,
        experienceLevel: updatedUser.experienceLevel,
        experienceYearsFrom: updatedUser.experienceYearsFrom,
        experienceYearsTo: updatedUser.experienceYearsTo,
        workTypes: updatedUser.workTypes,
        remoteOpen: updatedUser.remoteOpen,
        payType: updatedUser.payType,
        currency: updatedUser.currency,
        salaryExpectationFrom: updatedUser.salaryExpectationFrom,
        salaryExpectationTo: updatedUser.salaryExpectationTo,
        workAuthCountries: updatedUser.workAuthCountries,
        workAuthByCountry: updatedUser.workAuthByCountry,
        // Legacy fields
        jobTypes: updatedUser.jobTypes,
        preferredLocation: updatedUser.preferredLocation,
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


