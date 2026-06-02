import { prisma } from '@/lib/prisma';

const execute = process.argv.includes('--execute');

async function main() {
  const tasks = await prisma.task.findMany({
    where: { businessId: null },
    select: {
      id: true,
      title: true,
      project: { select: { businessId: true, name: true } },
      location: { select: { businessId: true, name: true } },
    },
  });

  const updates: { id: string; businessId: string; reason: string }[] = [];
  const ambiguous: { id: string; title: string }[] = [];

  for (const task of tasks) {
    const projectBusinessId = task.project?.businessId;
    const locationBusinessId = task.location?.businessId;

    if (projectBusinessId && locationBusinessId && projectBusinessId !== locationBusinessId) {
      ambiguous.push({ id: task.id, title: task.title });
      continue;
    }

    const businessId = projectBusinessId ?? locationBusinessId;
    if (!businessId) {
      ambiguous.push({ id: task.id, title: task.title });
      continue;
    }

    updates.push({
      id: task.id,
      businessId,
      reason: projectBusinessId ? `tablero "${task.project?.name}"` : `sector "${task.location?.name}"`,
    });
  }

  console.log(`Tareas sin businessId: ${tasks.length}`);
  console.log(`Backfill seguro: ${updates.length}`);
  console.log(`Ambiguas: ${ambiguous.length}`);

  if (!execute) {
    console.log('Dry-run. Ejecutar con --execute para aplicar cambios.');
  }

  if (execute) {
    for (const update of updates) {
      await prisma.task.update({
        where: { id: update.id },
        data: { businessId: update.businessId },
      });
    }
    console.log('Backfill aplicado.');
  }

  if (ambiguous.length > 0) {
    console.log('Tareas ambiguas (sin tablero/sector o relaciones cruzadas):');
    for (const task of ambiguous.slice(0, 50)) {
      console.log(`- ${task.id}: ${task.title}`);
    }
    if (ambiguous.length > 50) {
      console.log(`... ${ambiguous.length - 50} más`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
