import 'dotenv/config';
import { taskService } from '@/services/task.service';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function testCreateTask() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Mock global prisma for the service
  (globalThis as any).prisma = prisma;

  try {
    console.log('🔄 Intentando crear tarea de prueba...');
    const task = await taskService.createTask(
      {
        title: 'Tarea de Prueba de Visibilidad',
        description: 'Probando si es visible después de crear',
        status: 'todo',
        priority: 'medium',
        type: 'task',
        assigneeIds: [],
        tags: ['test'],
      },
      '2iIs0Pn1d8Vq00iJv1Z2wd1XYLJ3', // Admin test user
      'biz-test-123'
    );
    console.log('✅ Tarea creada exitosamente:', task.id);

    console.log('🔍 Verificando visibilidad para el negocio biz-test-123...');
    const tasks = await taskService.getTasksByBusiness('biz-test-123');
    const found = tasks.find(t => t.id === task.id);
    if (found) {
      console.log('✅ Tarea encontrada en la lista del negocio.');
    } else {
      console.warn('⚠️ ADVERTENCIA: La tarea NO aparece en la lista del negocio (error de filtrado confirmada).');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testCreateTask();
