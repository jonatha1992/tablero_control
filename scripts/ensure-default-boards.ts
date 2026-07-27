/**
 * One-shot: create tablero "Principal" for espacios (Business) with zero projects.
 * Run: npx tsx scripts/ensure-default-boards.ts
 */
import { prisma } from '../src/lib/prisma';
import { ensureDefaultBoard } from '../src/lib/default-board';

async function main() {
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, _count: { select: { projects: true } } },
  });

  let created = 0;
  for (const b of businesses) {
    if (b._count.projects === 0) {
      await ensureDefaultBoard(b.id);
      console.log(`Created default board for: ${b.name} (${b.id})`);
      created++;
    }
  }

  console.log(`Done. ${created} default board(s) created out of ${businesses.length} espacios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
