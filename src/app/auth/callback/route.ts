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
  const next = requestUrl.searchParams.get('next');

  console.log('Auth callback params:', { code: !!code, error, type, next });

  // Handle error from Supabase
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${error}&error_description=${errorDescription || ''}`, requestUrl.origin)
    );
  }

  // Handle code exchange (PKCE flow) - 主要用于邮箱验证
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
      
      // 从 user metadata 中获取用户类型（邮箱注册时设置）
      const metaUserType = user.user_metadata?.user_type;
      const finalUserType = (metaUserType === 'EMPLOYER' ? 'EMPLOYER' : 'CANDIDATE') as 'CANDIDATE' | 'EMPLOYER';
      
      console.log('Callback user info:', { 
        email: user.email, 
        provider: user.app_metadata?.provider,
        metaUserType,
        finalUserType,
        isGoogleOAuth 
      });
      
      // 如果是 Google OAuth，重定向到 confirm 页面让客户端处理（因为需要读取 localStorage）
      if (isGoogleOAuth) {
        console.log('Google OAuth - redirecting to /auth/confirm for client-side handling');
        return NextResponse.redirect(new URL('/auth/confirm', requestUrl.origin));
      }
      
      // 邮箱验证流程 - 服务端处理
      let redirectUrl = next || '/onboarding';
      
      try {
        // 等待一小段时间，让 Supabase 触发器有时间执行
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id }
        });

        if (!existingUser) {
          // 新用户 - 触发器可能没有执行或失败，手动创建用户记录
          // EMPLOYER 不需要做 onboarding，直接标记为完成
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              userType: finalUserType,
              hasCompletedOnboarding: finalUserType === 'EMPLOYER',
            }
          });
          
          console.log(`Created new user: ${user.email}, type: ${finalUserType}`);
          
          // 设置正确的重定向 URL
          redirectUrl = finalUserType === 'EMPLOYER' ? '/employer/dashboard' : '/onboarding';
        } else {
          // 用户已存在
          console.log('Existing user:', { 
            email: existingUser.email, 
            userType: existingUser.userType, 
            hasCompletedOnboarding: existingUser.hasCompletedOnboarding 
          });
          
          // 设置重定向 URL
          if (existingUser.userType === 'EMPLOYER') {
            redirectUrl = '/employer/dashboard';
          } else if (existingUser.hasCompletedOnboarding) {
            redirectUrl = '/explore';
          } else {
            redirectUrl = '/onboarding';
          }
        }
      } catch (dbError) {
        console.error('Database error during callback:', dbError);
        // 继续处理，即使数据库操作失败
      }
      
      // 检查是否是邀请类型
      if (type === 'invite') {
        return NextResponse.redirect(new URL('/auth/set-password', requestUrl.origin));
      }
      
      console.log('Redirecting to:', redirectUrl);
      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
    }

    return NextResponse.redirect(
      new URL(`/login?error=exchange_failed&error_description=${exchangeError?.message || 'Unknown error'}`, requestUrl.origin)
    );
  }

  // Handle hash fragment (implicit flow) - redirect to client-side handler
  return NextResponse.redirect(new URL('/auth/confirm', requestUrl.origin));
}

