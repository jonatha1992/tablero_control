import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined }

function getClient(): PrismaClient {
  if (!globalForPrisma._prisma) {
    globalForPrisma._prisma = new PrismaClient()
  }
  return globalForPrisma._prisma
}

// Lazy proxy: PrismaClient is NOT instantiated on import, only on first use.
// This prevents build-time failures when DATABASE_URL is not available.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    return getClient()[prop as keyof PrismaClient]
  },
})
