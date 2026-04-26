export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      console.log('⏳ Verificando conexión a la base de datos PostgreSQL...');
      
      const { prisma } = await import('@/lib/prisma');
      
      // Realizamos una consulta sencilla para verificar la conexión
      await prisma.$queryRaw`SELECT 1`;
      
      // Contar usuarios para asegurar que las tablas existen
      const userCount = await prisma.user.count();
      
      console.log('✅ Conexión exitosa a la base de datos PostgreSQL. Tablas accesibles.');
      console.log(`📊 Estadísticas: ${userCount} usuarios registrados actualmente.`);
    } catch (error) {
      console.error('❌ Error crítico: No se pudo conectar a la base de datos PostgreSQL.', error);
    }
  }
}
