import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  console.log("Iniciando test de conexion...");
  try {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    const prisma = new PrismaClient({ adapter });
    await prisma.$queryRaw`SELECT 1`;
    const count = await prisma.user.count();
    console.log("✅ Conexion exitosa. Total usuarios:", count);
  } catch (e) {
    console.error("❌ Falló:", e);
  }
}

main();
