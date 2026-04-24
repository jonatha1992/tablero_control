import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('Users:');
  users.forEach(u => console.log(`- ${u.email}: role=${u.role}, businessId=${u.businessId}`));

  const tasks = await prisma.task.findMany({
    include: { creator: true }
  });
  console.log('\nTasks:');
  tasks.forEach(t => console.log(`- ${t.title}: creator=${t.creator.email}, creator.businessId=${t.creator.businessId}, locationId=${t.locationId}, projectId=${t.projectId}`));

  await prisma.$disconnect();
}

check().catch(console.error);
