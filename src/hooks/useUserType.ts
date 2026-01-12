/**
 * useUserType Hook - 客户端用户类型检查
 * 从数据库获取用户类型，而不是仅依赖 Supabase metadata
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export type UserType = 'CANDIDATE' | 'EMPLOYER';

interface UseUserTypeOptions {
  required?: UserType;
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export function useUserType(options?: UseUserTypeOptions) {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // 从数据库获取用户类型
  const fetchUserTypeFromDB = useCallback(async (userId: string): Promise<UserType | null> => {
    try {
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        return userData.userType as UserType;
      }
    } catch (error) {
      console.error('Error fetching user type from DB:', error);
    }
    return null;
  }, []);

  useEffect(() => {
    const checkUserType = async () => {
      try {
        // 获取当前用户
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setLoading(false);
          
          // 如果需要特定用户类型，重定向到登录
          if (options?.required) {
            const loginPath = options.required === 'EMPLOYER' 
              ? '/companies/login' 
              : '/login';
            router.push(options?.redirectTo || loginPath);
          }
          return;
        }

        setUser(session.user);

        // 优先从数据库获取用户类型（适用于 OAuth 用户）
        // 其次从 user metadata 获取（适用于邮箱注册用户）
        let type: UserType | null = await fetchUserTypeFromDB(session.user.id);
        
        if (!type) {
          // 回退到 metadata
          const metadata = session.user.user_metadata;
          type = metadata?.user_type as UserType || 'CANDIDATE';
        }
        
        console.log('User type from DB/metadata:', type);
        setUserType(type);

        // 检查是否符合要求的用户类型
        if (options?.required && type !== options.required) {
          console.log(`Access denied: User is ${type}, required ${options.required}`);
          if (options?.onUnauthorized) {
            options.onUnauthorized();
          } else {
            // 根据用户类型重定向到合适的页面
            const redirectPath = type === 'EMPLOYER' 
              ? '/employer/dashboard' 
              : '/';
            router.push(options?.redirectTo || redirectPath);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking user type:', error);
        setLoading(false);
      }
    };

    checkUserType();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserType(null);
        
        if (options?.required) {
          const loginPath = options.required === 'EMPLOYER' 
            ? '/companies/login' 
            : '/login';
          router.push(loginPath);
        }
      } else if (session?.user) {
        setUser(session.user);
        // 从数据库获取最新的用户类型
        const type = await fetchUserTypeFromDB(session.user.id);
        setUserType(type || session.user.user_metadata?.user_type || 'CANDIDATE');
      }
    });

    return () => subscription.unsubscribe();
  }, [options?.required, options?.redirectTo, router, fetchUserTypeFromDB]);

  return {
    userType,
    loading,
    user,
    isCandidate: userType === 'CANDIDATE',
    isEmployer: userType === 'EMPLOYER',
  };
}



























