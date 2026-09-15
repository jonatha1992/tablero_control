import { prisma } from '@/lib/prisma';

export async function findBusinessAdminEmail(businessId: string, adminId: string): Promise<string | null> {
  const membership = await prisma.userBusiness.findUnique({
    where: { userId_businessId: { userId: adminId, businessId } },
    select: { isActive: true, role: true, user: { select: { email: true, isActive: true } } },
  });
  if (!membership?.isActive || !membership.user.isActive ||
    (membership.role !== 'admin' && membership.role !== 'superadmin')) return null;
  return membership.user.email;
}
