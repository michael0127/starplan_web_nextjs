import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 为高并发 / Serverless 场景优化的连接参数
const createPrismaClient = () => {
  const baseUrl = process.env.DATABASE_URL;

  // 在不改动 .env 的前提下，给连接串追加更保守的参数：
  // - connection_limit=1：单进程只占一个连接，有利于高并发下共享池
  // - pool_timeout=30：等待连接最长 30 秒，减少瞬时错误
  const datasourceUrl =
    baseUrl &&
    (baseUrl.includes('connection_limit=') || baseUrl.includes('pool_timeout='))
      ? baseUrl
      : baseUrl
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}connection_limit=1&pool_timeout=30`
      : undefined;

  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasourceUrl,
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 开发环境下复用单例，避免热重载时创建太多连接
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

