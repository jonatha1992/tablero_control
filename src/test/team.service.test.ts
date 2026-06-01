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

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userBusiness: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: { update: vi.fn() },
    task: { deleteMany: vi.fn() },
  },
}));

const mockFindByEmail = vi.mocked(userRepository.findByEmail);
const mockCreate = vi.mocked(userRepository.create);
const mockAddMembership = vi.mocked(userRepository.addMembership);
const mockSetLocationAssignments = vi.mocked(userRepository.setLocationAssignments);
const mockFindById = vi.mocked(userRepository.findById);

beforeEach(() => {
  vi.clearAllMocks();
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
