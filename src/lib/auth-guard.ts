/**
 * Auth Guard - 用户类型权限检查
 */

import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

export type UserType = 'CANDIDATE' | 'EMPLOYER';

/**
 * 获取当前用户的类型
 */
export async function getCurrentUserType(): Promise<UserType | null> {
  try {
    // 获取当前登录用户
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // 从数据库获取用户类型
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userType: true }
    });

    return dbUser?.userType || null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
}

/**
 * 检查用户是否为候选人
 */
export async function isCandidate(): Promise<boolean> {
  const userType = await getCurrentUserType();
  return userType === 'CANDIDATE';
}

/**
 * 检查用户是否为雇主
 */
export async function isEmployer(): Promise<boolean> {
  const userType = await getCurrentUserType();
  return userType === 'EMPLOYER';
}

/**
 * 要求用户必须是候选人，否则重定向
 */
export async function requireCandidate(redirectTo: string = '/companies/login') {
  const userType = await getCurrentUserType();
  
  if (!userType) {
    return { allowed: false, redirect: '/login' };
  }
  
  if (userType !== 'CANDIDATE') {
    return { allowed: false, redirect: redirectTo };
  }
  
  return { allowed: true, redirect: null };
}

/**
 * 要求用户必须是雇主，否则重定向
 */
export async function requireEmployer(redirectTo: string = '/login') {
  const userType = await getCurrentUserType();
  
  if (!userType) {
    return { allowed: false, redirect: '/companies/login' };
  }
  
  if (userType !== 'EMPLOYER') {
    return { allowed: false, redirect: redirectTo };
  }
  
  return { allowed: true, redirect: null };
}



























