import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type'); // 邀请类型
  const userType = requestUrl.searchParams.get('userType') || 'CANDIDATE'; // 用户类型 (Google OAuth)
  const next = requestUrl.searchParams.get('next') || '/onboarding';

  // Handle error from Supabase
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${error}&error_description=${errorDescription || ''}`, requestUrl.origin)
    );
  }

  // Handle code exchange (PKCE flow)
  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.session) {
      const user = data.session.user;
      const isGoogleOAuth = user.app_metadata?.provider === 'google';
      
      // 检查用户是否已存在于数据库中
      try {
        // 等待一小段时间，让 Supabase 触发器有时间执行
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id }
        });

        const finalUserType = (userType === 'EMPLOYER' ? 'EMPLOYER' : 'CANDIDATE') as 'CANDIDATE' | 'EMPLOYER';

        if (!existingUser) {
          // 新用户 - 触发器可能没有执行或失败，手动创建用户记录
          // Employer 不需要完成 onboarding，直接设置为 true
          const isEmployer = finalUserType === 'EMPLOYER';
          
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              userType: finalUserType,
              hasCompletedOnboarding: isEmployer, // Employer 不需要 onboarding
            }
          });
          
          console.log(`Created new user via Google OAuth: ${user.email}, type: ${finalUserType}`);
          
          // 新 Employer 直接跳转到 dashboard
          if (isEmployer) {
            return NextResponse.redirect(new URL('/employer/dashboard', requestUrl.origin));
          }
        } else {
          // 用户已存在
          // Employer 直接跳转到 dashboard，Candidate 检查 onboarding 状态
          if (existingUser.userType === 'EMPLOYER') {
            return NextResponse.redirect(new URL('/employer/dashboard', requestUrl.origin));
          }
          
          if (existingUser.hasCompletedOnboarding) {
            // Candidate 已完成 onboarding，跳转到 explore
            return NextResponse.redirect(new URL('/explore', requestUrl.origin));
          }
          
          // 如果是 Google OAuth 新用户（触发器创建的默认 CANDIDATE），需要更新用户类型和头像
          if (isGoogleOAuth) {
            const updates: Record<string, unknown> = {};
            
            // 如果用户选择了 EMPLOYER 类型，更新它（此时 existingUser.userType 是 CANDIDATE）
            if (finalUserType === 'EMPLOYER') {
              updates.userType = 'EMPLOYER';
              updates.hasCompletedOnboarding = true; // Employer 不需要 onboarding
            }
            
            // 更新头像（如果有）
            if (!existingUser.avatarUrl && (user.user_metadata?.avatar_url || user.user_metadata?.picture)) {
              updates.avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
            }
            
            // 更新名字（如果有）
            if (!existingUser.name && (user.user_metadata?.full_name || user.user_metadata?.name)) {
              updates.name = user.user_metadata?.full_name || user.user_metadata?.name;
            }
            
            if (Object.keys(updates).length > 0) {
              await prisma.user.update({
                where: { id: user.id },
                data: updates
              });
              console.log(`Updated user via Google OAuth: ${user.email}, updates:`, updates);
              
              // 如果更新为 Employer，直接跳转到 dashboard
              if (updates.userType === 'EMPLOYER') {
                return NextResponse.redirect(new URL('/employer/dashboard', requestUrl.origin));
              }
            }
          }
        }
      } catch (dbError) {
        console.error('Database error during OAuth callback:', dbError);
        // 继续处理，即使数据库操作失败
      }
      
      // 检查是否是邀请类型
      if (type === 'invite') {
        // 邀请用户需要先设置密码
        return NextResponse.redirect(new URL('/auth/set-password', requestUrl.origin));
      }
      
      // Candidate 新用户跳转到 onboarding
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    return NextResponse.redirect(
      new URL(`/login?error=exchange_failed&error_description=${exchangeError?.message || 'Unknown error'}`, requestUrl.origin)
    );
  }

  // Handle hash fragment (implicit flow) - redirect to client-side handler
  // If no code parameter, check for access_token in hash (handled by client)
  // Just redirect to a client-side page that will handle the hash
  const confirmUrl = new URL('/auth/confirm', requestUrl.origin);
  confirmUrl.searchParams.set('next', next);
  confirmUrl.searchParams.set('userType', userType);
  return NextResponse.redirect(confirmUrl);
}

