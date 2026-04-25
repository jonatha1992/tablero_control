import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeAuditLog } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCreate = vi.mocked(prisma.auditLog.create as ReturnType<typeof vi.fn>);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── writeAuditLog ────────────────────────────────────────────────────────────

describe('writeAuditLog()', () => {
  it('llama prisma.auditLog.create con los campos correctos', async () => {
    mockCreate.mockResolvedValueOnce({} as never);

    await writeAuditLog({
      actorId: 'user-1',
      actorRole: 'admin',
      businessId: 'biz-1',
      action: 'task.create' as never,
      targetType: 'Task',
      targetId: 'task-42',
      metadata: { title: 'Nueva tarea' },
      ip: '192.168.1.1',
    });

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'user-1',
        actorRole: 'admin',
        businessId: 'biz-1',
        action: 'task.create',
        targetType: 'Task',
        targetId: 'task-42',
        ip: '192.168.1.1',
      }),
    });
  });

  it('acepta actorId="system" para webhooks', async () => {
    mockCreate.mockResolvedValueOnce({} as never);

    await writeAuditLog({
      actorId: 'system',
      actorRole: 'system',
      action: 'subscription.update' as never,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'system',
        actorRole: 'system',
      }),
    });
  });

  it('businessId e ip son opcionales', async () => {
    mockCreate.mockResolvedValueOnce({} as never);

    await writeAuditLog({
      actorId: 'sa-1',
      actorRole: 'superadmin',
      action: 'business.suspend' as never,
    });

    const callArgs = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(callArgs.data.businessId).toBeUndefined();
    expect(callArgs.data.ip).toBeUndefined();
  });

  it('incluye metadata cuando se proporciona', async () => {
    mockCreate.mockResolvedValueOnce({} as never);
    const meta = { reason: 'payment_failed', amount: 999 };

    await writeAuditLog({
      actorId: 'system',
      actorRole: 'system',
      action: 'invoice.paid' as never,
      metadata: meta,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: meta,
      }),
    });
  });

  it('no propaga errores de Prisma (non-fatal)', async () => {
    const dbError = new Error('DB connection error');
    mockCreate.mockRejectedValueOnce(dbError);

    // writeAuditLog captura el error y no lo relanza
    await expect(
      writeAuditLog({
        actorId: 'user-1',
        actorRole: 'admin',
        action: 'task.create' as never,
      })
    ).resolves.toBeUndefined();
  });

  it('no incluye userAgent en los datos enviados a Prisma (no está en el schema)', async () => {
    mockCreate.mockResolvedValueOnce({} as never);

    await writeAuditLog({
      actorId: 'user-1',
      actorRole: 'admin',
      action: 'task.create' as never,
      userAgent: 'Mozilla/5.0',
    });

    // userAgent no se pasa al create (no está en el modelo Prisma según el código)
    const callArgs = mockCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(callArgs.data.userAgent).toBeUndefined();
  });
});
