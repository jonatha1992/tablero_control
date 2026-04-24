import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const result = await prisma.user.updateMany({
    data: { role: 'admin' }
  });
  console.log(`Updated ${result.count} users to admin.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
