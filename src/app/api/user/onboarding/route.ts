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


