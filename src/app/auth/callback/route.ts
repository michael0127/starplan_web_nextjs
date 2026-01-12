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

  console.log('Auth callback params:', { code: !!code, error, type, userType, next });

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
      
      // 从 user metadata 中获取用户类型（邮箱注册时设置）
      const metaUserType = user.user_metadata?.user_type;
      // 优先使用 URL 参数的 userType，其次是 metadata 中的 user_type
      const finalUserType = (userType === 'EMPLOYER' || metaUserType === 'EMPLOYER' ? 'EMPLOYER' : 'CANDIDATE') as 'CANDIDATE' | 'EMPLOYER';
      
      console.log('OAuth user info:', { 
        email: user.email, 
        provider: user.app_metadata?.provider,
        metaUserType,
        finalUserType,
        isGoogleOAuth 
      });
      
      // 检查用户是否已存在于数据库中
      let redirectUrl = next;
      
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
              hasCompletedOnboarding: finalUserType === 'EMPLOYER', // EMPLOYER 不需要 onboarding
            }
          });
          
          console.log(`Created new user: ${user.email}, type: ${finalUserType}, onboarding: ${finalUserType !== 'EMPLOYER'}`);
          
          // 设置正确的重定向 URL
          if (finalUserType === 'EMPLOYER') {
            redirectUrl = '/employer/dashboard';
          } else {
            redirectUrl = '/onboarding';
          }
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
          
          // 如果是 Google OAuth，需要更新用户信息
          if (isGoogleOAuth) {
            const updates: Record<string, unknown> = {};
            
            // 如果用户选择了 EMPLOYER 类型，更新它
            if (finalUserType === 'EMPLOYER' && existingUser.userType !== 'EMPLOYER') {
              updates.userType = 'EMPLOYER';
              updates.hasCompletedOnboarding = true; // EMPLOYER 不需要 onboarding
              redirectUrl = '/employer/dashboard';
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
              console.log(`Updated user: ${user.email}, updates:`, updates);
            }
          }
        }
      } catch (dbError) {
        console.error('Database error during OAuth callback:', dbError);
        // 继续处理，即使数据库操作失败
        // 使用 next 参数作为默认重定向
      }
      
      // 检查是否是邀请类型
      if (type === 'invite') {
        // 邀请用户需要先设置密码
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
  // If no code parameter, check for access_token in hash (handled by client)
  // Just redirect to a client-side page that will handle the hash
  return NextResponse.redirect(new URL('/auth/confirm', requestUrl.origin));
}

