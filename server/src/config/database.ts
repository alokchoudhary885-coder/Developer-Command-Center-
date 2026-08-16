import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function getDatabaseStatus(): Promise<'connected' | 'disconnected' | 'not_configured'> {
  if (!process.env.DATABASE_URL) {
    return 'not_configured';
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'disconnected';
  }
}
