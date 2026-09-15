import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teamService } from '@/services/team.service';
import { userRepository } from '@/repositories';
import { prisma } from '@/lib/prisma';

vi.mock('@/repositories', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
    addMembership: vi.fn(),
    setLocationAssignments: vi.fn(),
    updateActiveBusiness: vi.fn(),
    findById: vi.fn(),
    findActiveAdminsByBusiness: vi.fn(),
  },
  locationRepository: {
    bulkUpdateManagerId: vi.fn(),
    findByManagerId: vi.fn(),
    deleteByManagerId: vi.fn(),
  },
}));

const mockTxLocationUpdateMany = vi.fn();
const mockTxUserBusinessUpdate = vi.fn();
const mockTxUserFindUnique = vi.fn();
const mockTxUserUpdate = vi.fn();
const mockTxBusinessFindUnique = vi.fn();
const mockTxBusinessUpdate = vi.fn();
const mockTxMembershipFindUnique = vi.fn();
const mockTxLeavingMembershipFindFirst = vi.fn();
const mockTxAdminCount = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userBusiness: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: { update: vi.fn() },
    task: { deleteMany: vi.fn() },
    $transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
      callback({
        location: { updateMany: mockTxLocationUpdateMany },
        userBusiness: { update: mockTxUserBusinessUpdate, findUnique: mockTxMembershipFindUnique, findFirst: mockTxLeavingMembershipFindFirst, count: mockTxAdminCount },
        business: { findUnique: mockTxBusinessFindUnique, update: mockTxBusinessUpdate },
        user: { findUnique: mockTxUserFindUnique, update: mockTxUserUpdate },
      })
    ),
  },
}));

const mockFindByEmail = vi.mocked(userRepository.findByEmail);
const mockCreate = vi.mocked(userRepository.create);
const mockAddMembership = vi.mocked(userRepository.addMembership);
const mockSetLocationAssignments = vi.mocked(userRepository.setLocationAssignments);
const mockFindById = vi.mocked(userRepository.findById);

beforeEach(() => {
  vi.clearAllMocks();
  mockTxBusinessFindUnique.mockReset();
  mockTxBusinessUpdate.mockReset();
  mockTxMembershipFindUnique.mockReset();
  mockTxLeavingMembershipFindFirst.mockReset().mockResolvedValue({ isActive: true });
  mockTxAdminCount.mockReset().mockResolvedValue(1);
  mockTxUserFindUnique.mockReset();
  mockTxBusinessFindUnique.mockResolvedValue({ ownerId: 'other-owner' });
});

describe('teamService.inviteMember', () => {
  const businessId = 'biz-1';
  const assignments = [
    { locationId: 'loc-a', role: 'responsable' as const },
    { locationId: 'loc-b', role: 'viewer' as const },
  ];

  it('nuevo usuario: persiste locationAssignments con roles por sector', async () => {
    mockFindByEmail.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({
      id: 'user-new',
      name: 'Nuevo',
      email: 'n@x.com',
      role: 'miembro',
      businessId,
    } as never);
    mockFindById.mockResolvedValueOnce({ id: 'user-new', locationAssignments: assignments } as never);

    await teamService.inviteMember(
      { name: 'Nuevo', email: 'n@x.com', role: 'miembro', locationAssignments: assignments },
      businessId,
      'firebase-uid'
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 'loc-a',
      })
    );
    expect(mockSetLocationAssignments).toHaveBeenCalledWith('user-new', assignments);
    expect(mockAddMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-new',
        locationId: 'loc-a',
      })
    );
  });

  it('usuario existente: actualiza assignments sin recrear usuario', async () => {
    const existing = { id: 'user-existing', email: 'e@x.com', role: 'miembro', businessId };
    mockFindByEmail.mockResolvedValueOnce(existing as never);
    vi.mocked(prisma.userBusiness.findUnique).mockResolvedValueOnce({
      userId: 'user-existing',
      businessId,
      role: 'miembro',
      isActive: true,
    } as never);
    mockFindById.mockResolvedValueOnce({ ...existing, locationAssignments: assignments } as never);

    await teamService.inviteMember(
      { name: 'Existente', email: 'e@x.com', role: 'admin', locationAssignments: assignments },
      businessId
    );

    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockSetLocationAssignments).toHaveBeenCalledWith('user-existing', assignments);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-existing' },
      data: { locationId: 'loc-a' },
    });
  });

  it('compat locationId: deriva un assignment con el rol del invite', async () => {
    mockFindByEmail.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({ id: 'u1', role: 'viewer', businessId } as never);
    mockFindById.mockResolvedValueOnce({ id: 'u1' } as never);

    await teamService.inviteMember(
      { name: 'X', email: 'x@y.com', role: 'viewer', locationId: 'loc-only' },
      businessId
    );

    expect(mockSetLocationAssignments).toHaveBeenCalledWith('u1', [
      { locationId: 'loc-only', role: 'viewer' },
    ]);
  });
});

describe('teamService.leaveBusiness', () => {
  it('reintenta una colisión serializable sin dejar el espacio a medio transferir', async () => {
    vi.mocked(prisma.$transaction).mockRejectedValueOnce({ code: 'P2034' });
    mockTxBusinessFindUnique.mockResolvedValueOnce({ ownerId: 'leaving-user' });
    mockTxMembershipFindUnique.mockResolvedValueOnce({ role: 'admin', isActive: true, user: { isActive: true } });

    await teamService.leaveBusiness('leaving-user', 'biz-1', 'new-owner', 'new-owner');

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(mockTxBusinessUpdate).toHaveBeenCalledTimes(1);
  });

  it('no deja salir al último admin aunque el chequeo previo de la ruta haya pasado', async () => {
    mockTxLeavingMembershipFindFirst.mockResolvedValueOnce({ isActive: true, role: 'admin' });
    mockTxAdminCount.mockResolvedValueOnce(0);

    await expect(teamService.leaveBusiness('leaving-user', 'biz-1', 'other-admin')).rejects.toThrow('last_admin_cannot_leave');
    expect(mockTxUserBusinessUpdate).not.toHaveBeenCalled();
  });

  it('no transfiere propiedad si la membresía del dueño fue desactivada antes de la transacción', async () => {
    mockTxBusinessFindUnique.mockResolvedValueOnce({ ownerId: 'leaving-user' });
    mockTxLeavingMembershipFindFirst.mockResolvedValueOnce(null);
    mockTxMembershipFindUnique.mockResolvedValueOnce({ role: 'admin', isActive: true, user: { isActive: true } });

    await expect(teamService.leaveBusiness('leaving-user', 'biz-1', 'new-owner', 'new-owner')).rejects.toThrow('not_member');
    expect(mockTxBusinessUpdate).not.toHaveBeenCalled();
  });

  it('no desactiva al propietario vigente si llega una salida sin sucesor', async () => {
    mockTxBusinessFindUnique.mockResolvedValueOnce({ ownerId: 'leaving-user' });

    await expect(teamService.leaveBusiness('leaving-user', 'biz-1', 'other-admin')).rejects.toThrow('cannot_leave_owner');
    expect(mockTxUserBusinessUpdate).not.toHaveBeenCalled();
  });

  it('actualiza propietario y adminId en la misma transacción antes de desactivar al dueño', async () => {
    mockTxBusinessFindUnique.mockResolvedValueOnce({ ownerId: 'leaving-user' });
    mockTxMembershipFindUnique.mockResolvedValueOnce({ userId: 'new-owner', businessId: 'biz-1', role: 'admin', isActive: true, user: { isActive: true } });
    mockTxUserFindUnique.mockResolvedValueOnce({ businessId: 'biz-1' });

    await teamService.leaveBusiness('leaving-user', 'biz-1', 'new-owner', 'new-owner');

    expect(mockTxBusinessUpdate).toHaveBeenCalledWith({
      where: { id: 'biz-1' },
      data: { ownerId: 'new-owner', adminId: 'new-owner' },
    });
    expect(mockTxUserBusinessUpdate).toHaveBeenCalledWith({
      where: { userId_businessId: { userId: 'leaving-user', businessId: 'biz-1' } },
      data: { isActive: false },
    });
  });

  it('impide transferir a una membresía inactiva sin modificar el negocio', async () => {
    mockTxBusinessFindUnique.mockResolvedValueOnce({ ownerId: 'leaving-user' });
    mockTxMembershipFindUnique.mockResolvedValueOnce({ userId: 'new-owner', businessId: 'biz-1', role: 'admin', isActive: false, user: { isActive: true } });

    await expect(teamService.leaveBusiness('leaving-user', 'biz-1', 'new-owner', 'new-owner')).rejects.toThrow('invalid_new_owner');
    expect(mockTxBusinessUpdate).not.toHaveBeenCalled();
    expect(mockTxUserBusinessUpdate).not.toHaveBeenCalled();
  });

  it('impide transferir a una cuenta desactivada aunque su membresía siga activa', async () => {
    mockTxBusinessFindUnique.mockResolvedValueOnce({ ownerId: 'leaving-user' });
    mockTxMembershipFindUnique.mockResolvedValueOnce({ role: 'admin', isActive: true, user: { isActive: false } });

    await expect(teamService.leaveBusiness('leaving-user', 'biz-1', 'new-owner', 'new-owner')).rejects.toThrow('invalid_new_owner');
    expect(mockTxBusinessUpdate).not.toHaveBeenCalled();
  });
  it('reasigna sectores scoped por businessId, desactiva membresía y limpia negocio activo', async () => {
    mockTxUserFindUnique.mockResolvedValueOnce({ businessId: 'biz-1' });

    await teamService.leaveBusiness('leaving-user', 'biz-1', 'new-manager');

    expect(mockTxLocationUpdateMany).toHaveBeenCalledWith({
      where: { managerId: 'leaving-user', businessId: 'biz-1' },
      data: { managerId: 'new-manager' },
    });
    expect(mockTxUserBusinessUpdate).toHaveBeenCalledWith({
      where: { userId_businessId: { userId: 'leaving-user', businessId: 'biz-1' } },
      data: { isActive: false },
    });
    expect(mockTxUserUpdate).toHaveBeenCalledWith({
      where: { id: 'leaving-user' },
      data: { businessId: null },
    });
  });

  it('sin target de reasignación: no toca locations', async () => {
    mockTxUserFindUnique.mockResolvedValueOnce({ businessId: 'biz-1' });

    await teamService.leaveBusiness('leaving-user', 'biz-1', null);

    expect(mockTxLocationUpdateMany).not.toHaveBeenCalled();
    expect(mockTxUserBusinessUpdate).toHaveBeenCalledWith({
      where: { userId_businessId: { userId: 'leaving-user', businessId: 'biz-1' } },
      data: { isActive: false },
    });
  });

  it('businessId activo distinto: no limpia el negocio activo del usuario', async () => {
    mockTxUserFindUnique.mockResolvedValueOnce({ businessId: 'biz-2' });

    await teamService.leaveBusiness('leaving-user', 'biz-1', 'new-manager');

    expect(mockTxUserUpdate).not.toHaveBeenCalled();
  });
});
