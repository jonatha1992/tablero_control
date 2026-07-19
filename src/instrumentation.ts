export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      const userCount = await prisma.user.count();
      console.log(`[db] conectado — ${userCount} usuarios`);
    } catch (error) {
      console.error('[db] error de conexión:', error);
    }

    // Cron jobs internos — solo corren si CRON_SECRET está configurado
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      console.warn('[cron] CRON_SECRET no configurado — cron jobs desactivados');
      return;
    }

    const { default: cron } = await import('node-cron');
    const port = process.env.PORT ?? '3000';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`;
    const headers = { Authorization: `Bearer ${secret}` };

    const callCron = async (path: string) => {
      try {
        const res = await fetch(`${baseUrl}${path}`, { headers });
        const data = await res.json() as Record<string, unknown>;
        console.log(`[cron] ${path}`, data);
      } catch (err) {
        console.error(`[cron] ${path} falló:`, err);
      }
    };

    // Suscripciones vencidas + trials — todos los días a las 6:00 AM
    cron.schedule('0 6 * * *', () => callCron('/api/cron/subscription-expiry'));

    // Recordatorios de tareas — todos los días a las 8:00 AM
    cron.schedule('0 8 * * *', () => callCron('/api/cron/task-reminders'));

    // Recordatorios de eventos — todos los días a las 8:05 AM
    cron.schedule('5 8 * * *', () => callCron('/api/cron/event-reminders'));

    // Limpieza de adjuntos viejos — todos los domingos a las 2:00 AM
    cron.schedule('0 2 * * 0', () => callCron('/api/cron/attachment-cleanup'));

    console.log('[cron] jobs programados: subscription-expiry (6am), task-reminders (8am), event-reminders (8:05am), attachment-cleanup (dom 2am)');
  }
}
