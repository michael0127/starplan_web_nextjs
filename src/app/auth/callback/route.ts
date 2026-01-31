import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type'); // 邀请类型
  const next = requestUrl.searchParams.get('next');
  const teamInvitation = requestUrl.searchParams.get('team_invitation'); // 团队邀请 token

  console.log('Auth callback params:', { code: !!code, error, type, next, teamInvitation: !!teamInvitation });

  // Handle error from Supabase
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${error}&error_description=${errorDescription || ''}`, requestUrl.origin)
    );
  }

  // Handle code exchange (PKCE flow)
  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options as Record<string, unknown>)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data.session) {
      const user = data.session.user;
      const isGoogleOAuth = user.app_metadata?.provider === 'google';
      
      // 从 user metadata 中获取用户类型（邮箱注册时设置）
      const metaUserType = user.user_metadata?.user_type;
      
      console.log('Callback user info:', { 
        email: user.email, 
        provider: user.app_metadata?.provider,
        metaUserType,
        isGoogleOAuth 
      });
      
      // 如果是 Google OAuth，重定向到 confirm 页面让客户端处理
      // 因为需要读取 localStorage 来获取 userType
      if (isGoogleOAuth) {
        console.log('Google OAuth - redirecting to /auth/confirm for client-side handling');
        return NextResponse.redirect(new URL('/auth/confirm', requestUrl.origin));
      }
      
      // 邮箱验证流程 - 服务端处理
      const finalUserType = (metaUserType === 'EMPLOYER' ? 'EMPLOYER' : 'CANDIDATE') as 'CANDIDATE' | 'EMPLOYER';
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
          
          // 新注册的 employer 跳转到 settings 页面完善公司信息
          redirectUrl = finalUserType === 'EMPLOYER' ? '/employer/settings' : '/onboarding';
        } else {
          // 用户已存在
          console.log('Existing user:', { 
            email: existingUser.email, 
            userType: existingUser.userType, 
            hasCompletedOnboarding: existingUser.hasCompletedOnboarding 
          });
          
          // 设置重定向 URL
          if (existingUser.userType === 'EMPLOYER') {
            // 检查是否已完善公司信息
            const company = await prisma.company.findUnique({
              where: { userId: existingUser.id }
            });
            // 如果没有公司信息或公司名称为空，跳转到 settings
            if (!company || !company.companyName) {
              redirectUrl = '/employer/settings';
            } else {
              redirectUrl = '/employer/dashboard';
            }
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
      
      // 检查是否有团队邀请 token，如果有则重定向到邀请页面
      if (teamInvitation) {
        console.log('Team invitation token found, redirecting to invitation page');
        return NextResponse.redirect(new URL(`/team-invitation/${teamInvitation}`, requestUrl.origin));
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

