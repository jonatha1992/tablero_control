import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const configs = [
  { planId: 'free', priceMonthly: 0, priceYearly: 0, limitUsers: 3, limitLocations: 1, limitProjects: 2, limitAttachments: 10 },
  { planId: 'basic', priceMonthly: 15, priceYearly: 15, limitUsers: 10, limitLocations: 3, limitProjects: 10, limitAttachments: -1 },
  { planId: 'pro', priceMonthly: 30, priceYearly: 30, limitUsers: 50, limitLocations: 10, limitProjects: -1, limitAttachments: -1 },
  { planId: 'enterprise', priceMonthly: 99000, priceYearly: 99000, limitUsers: -1, limitLocations: -1, limitProjects: -1, limitAttachments: -1 },
] as const;

async function main() {
  for (const config of configs) {
    await prisma.planConfig.upsert({
      where: { planId: config.planId },
      create: config,
      update: config,
    });
    console.log(`Seeded plan: ${config.planId}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
