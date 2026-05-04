import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { requireUser, requireRole } from '@/lib/api/auth-helpers';
import { verifyToken } from '@/lib/firebase/admin';
import { prisma } from '@/lib/prisma';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase/admin', () => ({
  verifyToken: vi.fn(),
  getAdminApp: vi.fn(),
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(),
}));

const mockVerifyToken = vi.mocked(verifyToken);
const mockFindUnique = vi.mocked(prisma.user.findUnique as ReturnType<typeof vi.fn>);

function makeRequest(token?: string): NextRequest {
  return new NextRequest('http://localhost/api/test', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

const dbUser = {
  id: 'uid-1',
  email: 'test@test.com',
  name: 'Test User',
  role: 'admin',
  businessId: 'biz-1',
  locationId: null,
  customRoleIds: [],
  avatar: null,
  phone: null,
  isActive: true,
  lastLogin: null,
  preferences: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  teams: [{ teamId: 'team-1' }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── requireUser ──────────────────────────────────────────────────────────────

describe('requireUser()', () => {
  it('retorna 401 cuando no hay header Authorization', async () => {
    const req = makeRequest();
    const result = await requireUser(req);
    expect('status' in result && result.status).toBe(401);
    const body = await (result as Response).json();
    expect(body.error).toBe('missing_token');
  });

  it('retorna 401 cuando Authorization no empieza con "Bearer "', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    const result = await requireUser(req);
    expect('status' in result && result.status).toBe(401);
  });

  it('retorna 401 cuando el token es inválido (verifyToken lanza)', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('Token invalid'));
    const req = makeRequest('bad-token');
    const result = await requireUser(req);
    expect('status' in result && result.status).toBe(401);
    const body = await (result as Response).json();
    expect(body.error).toBe('invalid_token');
  });

  it('retorna 404 cuando el usuario no existe en BD', async () => {
    mockVerifyToken.mockResolvedValueOnce({ uid: 'uid-1', email: 'test@test.com' } as never);
    mockFindUnique.mockResolvedValueOnce(null);
    const req = makeRequest('valid-token');
    const result = await requireUser(req);
    expect('status' in result && result.status).toBe(404);
    const body = await (result as Response).json();
    expect(body.error).toBe('user_not_found');
  });

  it('retorna AuthedUser correcto cuando token y usuario son válidos', async () => {
    mockVerifyToken.mockResolvedValueOnce({
      uid: 'uid-1',
      email: 'test@test.com',
      role: 'admin',
      businessId: 'biz-1',
    } as never);
    mockFindUnique.mockResolvedValueOnce(dbUser);
    const req = makeRequest('valid-token');
    const result = await requireUser(req);

    // Debería ser AuthedUser (no NextResponse)
    expect('uid' in result).toBe(true);
    if ('uid' in result) {
      expect(result.uid).toBe('uid-1');
      expect(result.role).toBe('admin');
      expect(result.businessId).toBe('biz-1');
      expect(result.email).toBe('test@test.com');
      expect(result.data.id).toBe('uid-1');
      expect(result.data.teamIds).toEqual(['team-1']);
    }
  });

  it('incluye teamIds mapeados desde user.teams', async () => {
    mockVerifyToken.mockResolvedValueOnce({ uid: 'uid-1', email: 'u@u.com' } as never);
    mockFindUnique.mockResolvedValueOnce({
      ...dbUser,
      teams: [{ teamId: 'team-A' }, { teamId: 'team-B' }],
    });
    const req = makeRequest('tok');
    const result = await requireUser(req);
    if ('uid' in result) {
      expect(result.data.teamIds).toEqual(['team-A', 'team-B']);
    }
  });
});

// ─── requireRole ─────────────────────────────────────────────────────────────

describe('requireRole()', () => {
  const authedUser = {
    uid: 'uid-1',
    role: 'admin' as const,
    businessId: 'biz-1',
    email: 'a@b.com',
    data: {} as never,
  };

  it('retorna null cuando el rol es permitido', () => {
    expect(requireRole(authedUser, ['admin'])).toBeNull();
    expect(requireRole(authedUser, ['superadmin', 'admin'])).toBeNull();
  });

  it('retorna 403 cuando el rol no está en la lista permitida', async () => {
    const result = requireRole(authedUser, ['superadmin']);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
    const body = await result!.json();
    expect(body.error).toBe('forbidden');
  });

  it('retorna 403 para lista vacía de roles permitidos', () => {
    const result = requireRole(authedUser, []);
    expect(result?.status).toBe(403);
  });
});
