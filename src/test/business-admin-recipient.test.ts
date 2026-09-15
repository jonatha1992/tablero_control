import { describe, it, expect, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { findBusinessAdminEmail } from '@/lib/business-admin-recipient';

vi.mock('@/lib/prisma', () => ({ prisma: { userBusiness: { findUnique: vi.fn() } } }));

describe('findBusinessAdminEmail', () => {
  it('usa la membresía del admin aunque su espacio activo sea otro', async () => {
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce({
      isActive: true, role: 'admin', user: { email: 'admin@example.com', isActive: true, businessId: 'other-biz' },
    } as never);

    expect(await findBusinessAdminEmail('biz-1', 'admin-2')).toBe('admin@example.com');
    expect(prisma.userBusiness.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_businessId: { userId: 'admin-2', businessId: 'biz-1' } },
    }));
  });

  it('no envía correo a una membresía desactivada', async () => {
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce({
      isActive: false, role: 'admin', user: { email: 'old@example.com', isActive: true },
    } as never);

    expect(await findBusinessAdminEmail('biz-1', 'old-owner')).toBeNull();
  });
});
