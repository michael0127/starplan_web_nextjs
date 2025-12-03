/**
 * User 数据访问层
 * 提供用户相关的数据库操作
 */

import { prisma } from './prisma';
import { User } from '@prisma/client';

export type UserCreateInput = {
  id: string; // 来自 Supabase Auth 的 user.id
  email: string;
  name?: string;
  avatarUrl?: string;
};

export type UserUpdateInput = {
  name?: string;
  avatarUrl?: string;
};

/**
 * 获取所有用户
 */
export async function getAllUsers(): Promise<User[]> {
  return prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

/**
 * 根据 email 获取用户
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * 创建用户
 * 注意：通常由 Supabase 触发器自动创建，这个方法用于特殊情况
 */
export async function createUser(data: UserCreateInput): Promise<User> {
  return prisma.user.create({
    data: {
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
    },
  });
}

/**
 * 更新用户信息
 */
export async function updateUser(
  id: string,
  data: UserUpdateInput
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    },
  });
}

/**
 * 删除用户
 * 注意：通常由 Supabase 触发器自动删除，这个方法用于特殊情况
 */
export async function deleteUser(id: string): Promise<User> {
  return prisma.user.delete({
    where: { id },
  });
}

/**
 * 检查用户是否存在
 */
export async function userExists(id: string): Promise<boolean> {
  const count = await prisma.user.count({
    where: { id },
  });
  return count > 0;
}

/**
 * 检查 email 是否已被使用
 */
export async function emailExists(email: string): Promise<boolean> {
  const count = await prisma.user.count({
    where: { email },
  });
  return count > 0;
}

/**
 * 搜索用户（按 name 或 email）
 */
export async function searchUsers(query: string): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * 获取用户统计信息
 */
export async function getUserStats() {
  const total = await prisma.user.count();
  const withNames = await prisma.user.count({
    where: { name: { not: null } },
  });
  const withAvatars = await prisma.user.count({
    where: { avatarUrl: { not: null } },
  });

  return {
    total,
    withNames,
    withAvatars,
  };
}

