import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/profile/route';
import { verifyToken } from '@/lib/firebase/admin';
import { userRepository, businessRepository } from '@/repositories';

vi.mock('@/lib/firebase/admin', () => ({
  verifyToken: vi.fn(),
  getAdminApp: vi.fn(),
  getAdminAuth: vi.fn(),
}));

vi.mock('@/repositories', () => ({
  userRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    updateId: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    addMembership: vi.fn(),
  },
  businessRepository: {
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

const mockVerifyToken = vi.mocked(verifyToken);
const mockFindById = vi.mocked(userRepository.findById);
const mockFindByEmail = vi.mocked(userRepository.findByEmail);
const mockUpdateId = vi.mocked(userRepository.updateId);
const mockUpdate = vi.mocked(userRepository.update);
const mockUserCreate = vi.mocked(userRepository.create);
const mockBusinessCreate = vi.mocked(businessRepository.create);
const mockBusinessFindById = vi.mocked(businessRepository.findById);

const baseDecoded = { uid: 'uid-real', email: 'user@test.com', name: 'Test User', picture: undefined };
const dbUser = {
  id: 'uid-real', email: 'user@test.com', name: 'Test User',
  role: 'admin', businessId: 'biz-1', isActive: true,
  memberships: [{ businessId: 'biz-1', role: 'admin', isActive: true }],
};

function makeRequest(token?: string): NextRequest {
  return new NextRequest('http://localhost/api/auth/profile', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('SUPERADMIN_EMAILS', 'superadmin@test.com');
  mockBusinessFindById.mockResolvedValue({ id: 'biz-1', ownerId: 'other-user' } as never);
});

// ─── Auth ────────────────────────────────────────────────────────────────────

describe('GET /api/auth/profile — auth', () => {
  it('retorna 401 sin Authorization header', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('retorna 401 si verifyToken lanza', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('Invalid token'));
    const res = await GET(makeRequest('bad-token'));
    expect(res.status).toBe(401);
  });
});

// ─── Usuario encontrado por UID ───────────────────────────────────────────────

describe('GET /api/auth/profile — usuario en DB', () => {
  it('retorna 200 con datos del usuario si findById lo encuentra', async () => {
    mockVerifyToken.mockResolvedValueOnce(baseDecoded as never);
    mockFindById.mockResolvedValueOnce(dbUser as never);

    const res = await GET(makeRequest('valid-token'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('uid-real');
    expect(body.email).toBe('user@test.com');
  });

  it('no llama findByEmail si findById tiene éxito', async () => {
    mockVerifyToken.mockResolvedValueOnce(baseDecoded as never);
    mockFindById.mockResolvedValueOnce(dbUser as never);

    await GET(makeRequest('valid-token'));
    expect(mockFindByEmail).not.toHaveBeenCalled();
  });
});

// ─── Link por email (usuario invitado) ───────────────────────────────────────

describe('GET /api/auth/profile — link por email', () => {
  it('vincula UID cuando findById falla pero findByEmail encuentra usuario', async () => {
    const existingUser = { ...dbUser, id: 'old-uid' };
    const updatedUser = { ...dbUser, id: 'uid-real' };

    mockVerifyToken.mockResolvedValueOnce(baseDecoded as never);
    mockFindById.mockResolvedValueOnce(null);
    mockFindByEmail.mockResolvedValueOnce(existingUser as never);
    mockUpdateId.mockResolvedValueOnce(updatedUser as never);

    const res = await GET(makeRequest('valid-token'));
    expect(res.status).toBe(200);
    expect(mockUpdateId).toHaveBeenCalledWith('old-uid', 'uid-real');
    const body = await res.json();
    expect(body.id).toBe('uid-real');
  });

  it('retorna existingByEmail como fallback si updateId lanza', async () => {
    const existingUser = { ...dbUser, id: 'old-uid' };

    mockVerifyToken.mockResolvedValueOnce(baseDecoded as never);
    mockFindById.mockResolvedValueOnce(null);
    mockFindByEmail.mockResolvedValueOnce(existingUser as never);
    mockUpdateId.mockRejectedValueOnce(new Error('FK constraint'));

    const res = await GET(makeRequest('valid-token'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('old-uid');
  });
});

// ─── Auto-provisioning superadmin ─────────────────────────────────────────────

describe('GET /api/auth/profile — auto-provisioning superadmin', () => {
  const superDecoded = { uid: 'super-uid', email: 'superadmin@test.com', name: 'SA', picture: undefined };
  const mockBusiness = { id: 'biz-sa', name: 'TecnoFusión (Master)' };
  const provisionedUser = {
    id: 'super-uid', email: 'superadmin@test.com', role: 'superadmin', businessId: 'biz-sa', isActive: true,
    memberships: [{ businessId: 'biz-sa', role: 'superadmin', isActive: true }],
  };

  it('crea business + user si email está en SUPERADMIN_EMAILS y no está en DB', async () => {
    mockVerifyToken.mockResolvedValueOnce(superDecoded as never);
    mockFindById.mockResolvedValueOnce(null);
    mockFindByEmail.mockResolvedValueOnce(null);
    mockBusinessCreate.mockResolvedValueOnce(mockBusiness as never);
    mockUserCreate.mockResolvedValueOnce(provisionedUser as never);

    const res = await GET(makeRequest('sa-token'));
    expect(res.status).toBe(200);
    expect(mockBusinessCreate).toHaveBeenCalledOnce();
    expect(mockUserCreate).toHaveBeenCalledWith(expect.objectContaining({
      id: 'super-uid',
      email: 'superadmin@test.com',
      role: 'superadmin',
    }));
    const body = await res.json();
    expect(body.role).toBe('superadmin');
  });

  it('no provisiona si email NO está en SUPERADMIN_EMAILS', async () => {
    mockVerifyToken.mockResolvedValueOnce({ uid: 'x', email: 'unknown@test.com' } as never);
    mockFindById.mockResolvedValueOnce(null);
    mockFindByEmail.mockResolvedValueOnce(null);

    const res = await GET(makeRequest('x-token'));
    expect(res.status).toBe(404);
    expect(mockBusinessCreate).not.toHaveBeenCalled();
  });
});

// ─── not_invited ──────────────────────────────────────────────────────────────

describe('GET /api/auth/profile — not_invited', () => {
  it('retorna 404 si usuario no está en DB y no es superadmin', async () => {
    mockVerifyToken.mockResolvedValueOnce({ uid: 'x', email: 'stranger@x.com' } as never);
    mockFindById.mockResolvedValueOnce(null);
    mockFindByEmail.mockResolvedValueOnce(null);

    const res = await GET(makeRequest('x-token'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('not_invited');
  });
});

// ─── businessId missing ───────────────────────────────────────────────────────

describe('GET /api/auth/profile — usuario sin businessId', () => {
  it('crea business y lo asigna si el usuario no tiene businessId', async () => {
    const userNoBiz = { ...dbUser, businessId: null };
    const mockBiz = { id: 'biz-new' };
    const updatedUser = { ...dbUser, businessId: 'biz-new' };

    mockVerifyToken.mockResolvedValueOnce(baseDecoded as never);
    mockFindById.mockResolvedValueOnce(userNoBiz as never);
    mockBusinessCreate.mockResolvedValueOnce(mockBiz as never);
    mockUpdate.mockResolvedValueOnce(updatedUser as never);

    const res = await GET(makeRequest('valid-token'));
    expect(res.status).toBe(200);
    expect(mockBusinessCreate).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledWith('uid-real', { businessId: 'biz-new', role: 'admin' });
    const body = await res.json();
    expect(body.businessId).toBe('biz-new');
  });
});
