/**
 * useUser Hook
 * 用于在客户端组件中获取用户数据
 */

'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';

/**
 * 获取单个用户的 Hook
 */
export function useUser(userId: string | null | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    if (!userId) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user/${userId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const refreshUser = async () => {
    await fetchUser();
  };

  return { user, loading, error, refreshUser };
}

/**
 * 获取用户列表的 Hook
 */
export function useUsers(searchQuery?: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);

        const url = searchQuery
          ? `/api/users?q=${encodeURIComponent(searchQuery)}`
          : '/api/users';

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [searchQuery]);

  return { users, loading, error };
}

/**
 * 更新用户信息的 Hook
 */
export function useUpdateUser() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (
    userId: string,
    data: { name?: string; avatarUrl?: string }
  ): Promise<User | null> => {
    try {
      setUpdating(true);
      setError(null);

      const response = await fetch(`/api/user/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      return updatedUser;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setUpdating(false);
    }
  };

  return { updateUser, updating, error };
}


















