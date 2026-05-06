import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
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
  },
}));

vi.mock('@/services/mail.service', () => ({
  MailService: { sendWelcomeEmail: vi.fn().mockResolvedValue(undefined) },
}));

const mockVerifyToken = vi.mocked(verifyToken);
const mockFindById = vi.mocked(userRepository.findById);
const mockFindByEmail = vi.mocked(userRepository.findByEmail);
const mockUpdateId = vi.mocked(userRepository.updateId);
const mockUserCreate = vi.mocked(userRepository.create);
const mockBusinessCreate = vi.mocked(businessRepository.create);

const decoded = { uid: 'uid-new', email: 'new@test.com', name: 'Nuevo', picture: null };
const mockBusiness = { id: 'biz-1', name: 'Negocio de Nuevo' };
const createdUser = { id: 'uid-new', email: 'new@test.com', name: 'Nuevo', role: 'admin', businessId: 'biz-1' };

function makeRequest(token: string, body?: object): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('SUPERADMIN_EMAILS', 'superadmin@test.com');
});

// ─── Auth ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register — auth', () => {
  it('retorna 401 sin Authorization header', async () => {
    const req = new NextRequest('http://localhost/api/auth/register', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 401 si verifyToken lanza', async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error('bad token'));
    const res = await POST(makeRequest('bad'));
    expect(res.status).toBe(401);
  });
});

// ─── Idempotente: usuario ya existe ──────────────────────────────────────────

describe('POST /api/auth/register — idempotente', () => {
  it('retorna 200 con usuario existente si findById lo encuentra', async () => {
    mockVerifyToken.mockResolvedValueOnce(decoded as never);
    mockFindById.mockResolvedValueOnce(createdUser as never);

    const res = await POST(makeRequest('tok'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('uid-new');
    expect(mockBusinessCreate).not.toHaveBeenCalled();
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it('vincula UID si email existe con distinto UID y retorna 200', async () => {
    const existingByEmail = { ...createdUser, id: 'old-uid' };
    const linked = { ...createdUser, id: 'uid-new' };

    mockVerifyToken.mockResolvedValueOnce(decoded as never);
    mockFindById.mockResolvedValueOnce(null);
    mockFindByEmail.mockResolvedValueOnce(existingByEmail as never);
    mockUpdateId.mockResolvedValueOnce(linked as never);

    const res = await POST(makeRequest('tok'));
    expect(res.status).toBe(200);
    expect(mockUpdateId).toHaveBeenCalledWith('old-uid', 'uid-new');
  });
});

// ─── Nuevo usuario ────────────────────────────────────────────────────────────

describe('POST /api/auth/register — nuevo usuario', () => {
  beforeEach(() => {
    mockVerifyToken.mockResolvedValueOnce(decoded as never);
    mockFindById.mockResolvedValueOnce(null);
    mockFindByEmail.mockResolvedValueOnce(null);
    mockBusinessCreate.mockResolvedValueOnce(mockBusiness as never);
    mockUserCreate.mockResolvedValueOnce(createdUser as never);
  });

  it('crea business y user, retorna 201', async () => {
    const res = await POST(makeRequest('tok'));
    expect(res.status).toBe(201);
    expect(mockBusinessCreate).toHaveBeenCalledOnce();
    expect(mockUserCreate).toHaveBeenCalledOnce();
  });

  it('asigna rol admin para usuarios comunes', async () => {
    await POST(makeRequest('tok'));
    expect(mockUserCreate).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
  });

  it('usa businessName del body si se provee', async () => {
    const res = await POST(makeRequest('tok', { businessName: 'Mi Empresa SA' }));
    expect(res.status).toBe(201);
    expect(mockBusinessCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mi Empresa SA' }));
  });
});

// ─── Superadmin ───────────────────────────────────────────────────────────────

describe('POST /api/auth/register — superadmin', () => {
  it('asigna rol superadmin si email está en SUPERADMIN_EMAILS', async () => {
    const saDecoded = { uid: 'sa-uid', email: 'superadmin@test.com', name: 'SA' };
    const saBusiness = { id: 'biz-sa', name: 'TecnoFusión (Master)' };
    const saUser = { ...createdUser, id: 'sa-uid', email: 'superadmin@test.com', role: 'superadmin' };

    mockVerifyToken.mockResolvedValueOnce(saDecoded as never);
    mockFindById.mockResolvedValueOnce(null);
    mockFindByEmail.mockResolvedValueOnce(null);
    mockBusinessCreate.mockResolvedValueOnce(saBusiness as never);
    mockUserCreate.mockResolvedValueOnce(saUser as never);

    const res = await POST(makeRequest('sa-tok'));
    expect(res.status).toBe(201);
    expect(mockUserCreate).toHaveBeenCalledWith(expect.objectContaining({ role: 'superadmin' }));
    expect(mockBusinessCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'TecnoFusión (Master)' }));
  });
});
