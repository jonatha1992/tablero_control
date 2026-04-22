import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL no está definida en el entorno.');
    return;
  }

  console.log('🔄 Conectando a:', connectionString.split('@')[1]); // Solo mostramos el host por seguridad

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ Conexión exitosa:', result);
    
    const users = await prisma.user.findMany({ take: 5 });
    console.log('👥 Usuarios encontrados:', users.map(u => ({ id: u.id, email: u.email, businessId: u.businessId })));
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testConnection();
