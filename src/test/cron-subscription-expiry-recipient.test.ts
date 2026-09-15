import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/subscription-expiry/route';
import { prisma } from '@/lib/prisma';
import { MailService } from '@/services/mail.service';
import { findBusinessAdminEmail } from '@/lib/business-admin-recipient';

vi.mock('@/lib/prisma', () => ({ prisma: {
  business: { updateMany: vi.fn() },
  subscription: { updateMany: vi.fn(), findMany: vi.fn() },
} }));
vi.mock('@/services/mail.service', () => ({ MailService: { sendSubscriptionExpiryEmail: vi.fn() } }));
vi.mock('@/lib/business-admin-recipient', () => ({ findBusinessAdminEmail: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('subscription expiry mail recipient', () => {
  it('envía el aviso al admin por membresía aunque tenga otro espacio activo', async () => {
    vi.stubEnv('CRON_SECRET', 'test-cron');
    vi.mocked(prisma.business.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.subscription.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.subscription.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ businessId: 'biz-1', business: { name: 'Espacio', adminId: 'admin-2' },
        currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), plan: 'pro' }] as never);
    vi.mocked(findBusinessAdminEmail).mockResolvedValueOnce('new-owner@example.com');
    vi.mocked(MailService.sendSubscriptionExpiryEmail).mockResolvedValueOnce(undefined as never);

    const res = await GET(new NextRequest('http://localhost/api/cron/subscription-expiry', {
      headers: { authorization: 'Bearer test-cron' },
    }));

    expect(res.status).toBe(200);
    expect(findBusinessAdminEmail).toHaveBeenCalledWith('biz-1', 'admin-2');
    expect(MailService.sendSubscriptionExpiryEmail).toHaveBeenCalledWith('new-owner@example.com', expect.any(Object));
  });
});
