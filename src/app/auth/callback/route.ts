import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type'); // 邀请类型
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
      // 检查是否是邀请类型
      if (type === 'invite') {
        // 邀请用户需要先设置密码
        return NextResponse.redirect(new URL('/auth/set-password', requestUrl.origin));
      }
      
      // 普通注册用户直接跳转到 next 页面
      return NextResponse.redirect(new URL(next, requestUrl.origin));
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

