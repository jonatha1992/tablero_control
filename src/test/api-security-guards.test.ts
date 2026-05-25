import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn().mockReturnValue(null),
  requireActiveSubscription: vi.fn().mockReturnValue(null),
}));
vi.mock('@/lib/api/audit', () => ({ writeAuditLog: vi.fn() }));
vi.mock('@/lib/notifications', () => ({ sendNotification: vi.fn() }));
vi.mock('@/services/cycle.service', () => ({
  cycleService: {
    getCycleById: vi.fn(),
    updateCycle: vi.fn(),
    deleteCycle: vi.fn(),
    startCycle: vi.fn(),
    completeCycle: vi.fn(),
    closeCycle: vi.fn(),
  },
}));
vi.mock('@/services/location.service', () => ({
  locationService: {
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('@/services/comment.service', () => ({
  commentService: {
    removeComment: vi.fn(),
  },
}));

import { cycleService } from '@/services/cycle.service';
import { locationService } from '@/services/location.service';
import { commentService } from '@/services/comment.service';
import { prisma } from '@/lib/prisma';

const mockRequireUser = vi.mocked(requireUser);
const mockGetCycle = vi.mocked(cycleService.getCycleById);
const mockGetLocation = vi.mocked(locationService.getById);
const mockCommentFindUnique = vi.mocked(prisma.comment.findUnique);

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => Promise<Response>;

function makeUser(role: string, uid = 'user-1') {
  return {
    uid,
    role,
    businessId: 'biz-1',
    email: `${role}@biz.com`,
    name: role,
    data: { id: uid, role, businessId: 'biz-1' },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Cycles PATCH/DELETE role guard ─────────────────────────────────────────

describe('Cycles [id] role guards', () => {
  let PATCH: RouteHandler, DELETE: RouteHandler;

  beforeEach(async () => {
    const mod = await import('@/app/api/cycles/[id]/route');
    PATCH = mod.PATCH;
    DELETE = mod.DELETE;
  });

  it('PATCH returns 403 for viewer', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('viewer') as never);
    const req = new NextRequest('http://localhost/api/cycles/c-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'c-1' }) });
    expect(res.status).toBe(403);
  });

  it('PATCH returns 403 for miembro', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('miembro') as never);
    const req = new NextRequest('http://localhost/api/cycles/c-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'c-1' }) });
    expect(res.status).toBe(403);
  });

  it('DELETE returns 403 for viewer', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('viewer') as never);
    const req = new NextRequest('http://localhost/api/cycles/c-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'c-1' }) });
    expect(res.status).toBe(403);
  });

  it('DELETE returns 403 for miembro', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('miembro') as never);
    const req = new NextRequest('http://localhost/api/cycles/c-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'c-1' }) });
    expect(res.status).toBe(403);
  });

  it('DELETE allowed for admin', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('admin') as never);
    mockGetCycle.mockResolvedValueOnce({ id: 'c-1', businessId: 'biz-1' } as never);
    vi.mocked(cycleService.deleteCycle).mockResolvedValueOnce(undefined as never);
    const req = new NextRequest('http://localhost/api/cycles/c-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'c-1' }) });
    expect(res.status).toBe(200);
  });

  it('PATCH allowed for responsable', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('responsable') as never);
    mockGetCycle.mockResolvedValueOnce({ id: 'c-1', businessId: 'biz-1', name: 'Sprint 1' } as never);
    vi.mocked(cycleService.updateCycle).mockResolvedValueOnce({ id: 'c-1' } as never);
    const req = new NextRequest('http://localhost/api/cycles/c-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'c-1' }) });
    expect(res.status).toBe(200);
  });
});

// ─── Locations PATCH/DELETE role guard ───────────────────────────────────────

describe('Locations [id] role guards', () => {
  let PATCH: RouteHandler, DELETE: RouteHandler;

  beforeEach(async () => {
    const mod = await import('@/app/api/locations/[id]/route');
    PATCH = mod.PATCH;
    DELETE = mod.DELETE;
  });

  it('PATCH returns 403 for miembro', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('miembro') as never);
    const req = new NextRequest('http://localhost/api/locations/loc-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'loc-1' }) });
    expect(res.status).toBe(403);
  });

  it('PATCH returns 403 for viewer', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('viewer') as never);
    const req = new NextRequest('http://localhost/api/locations/loc-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'loc-1' }) });
    expect(res.status).toBe(403);
  });

  it('DELETE returns 403 for miembro', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('miembro') as never);
    const req = new NextRequest('http://localhost/api/locations/loc-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'loc-1' }) });
    expect(res.status).toBe(403);
  });

  it('PATCH allowed for admin', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('admin') as never);
    mockGetLocation.mockResolvedValueOnce({ id: 'loc-1', businessId: 'biz-1' } as never);
    vi.mocked(locationService.update).mockResolvedValueOnce({ id: 'loc-1' } as never);
    const req = new NextRequest('http://localhost/api/locations/loc-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'loc-1' }) });
    expect(res.status).toBe(200);
  });
});

// ─── Comments DELETE ownership guard ────────────────────────────────────────

describe('Comments [id] DELETE ownership guard', () => {
  let DELETE: RouteHandler;

  beforeEach(async () => {
    const mod = await import('@/app/api/comments/[id]/route');
    DELETE = mod.DELETE;
  });

  it('miembro can delete own comment', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('miembro', 'user-1') as never);
    mockCommentFindUnique.mockResolvedValueOnce({
      authorId: 'user-1',
      task: { project: { businessId: 'biz-1' }, location: null, creator: null },
    } as never);
    vi.mocked(commentService.removeComment).mockResolvedValueOnce(undefined as never);
    const req = new NextRequest('http://localhost/api/comments/cmt-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'cmt-1' }) });
    expect(res.status).toBe(200);
  });

  it('miembro cannot delete other user comment', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('miembro', 'user-1') as never);
    mockCommentFindUnique.mockResolvedValueOnce({
      authorId: 'user-2',
      task: { project: { businessId: 'biz-1' }, location: null, creator: null },
    } as never);
    const req = new NextRequest('http://localhost/api/comments/cmt-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'cmt-1' }) });
    expect(res.status).toBe(403);
  });

  it('admin can delete any comment', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('admin', 'user-1') as never);
    mockCommentFindUnique.mockResolvedValueOnce({
      authorId: 'user-2',
      task: { project: { businessId: 'biz-1' }, location: null, creator: null },
    } as never);
    vi.mocked(commentService.removeComment).mockResolvedValueOnce(undefined as never);
    const req = new NextRequest('http://localhost/api/comments/cmt-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'cmt-1' }) });
    expect(res.status).toBe(200);
  });

  it('responsable can delete any comment', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('responsable', 'user-1') as never);
    mockCommentFindUnique.mockResolvedValueOnce({
      authorId: 'user-2',
      task: { project: { businessId: 'biz-1' }, location: null, creator: null },
    } as never);
    vi.mocked(commentService.removeComment).mockResolvedValueOnce(undefined as never);
    const req = new NextRequest('http://localhost/api/comments/cmt-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'cmt-1' }) });
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent comment', async () => {
    mockRequireUser.mockResolvedValueOnce(makeUser('admin') as never);
    mockCommentFindUnique.mockResolvedValueOnce(null as never);
    const req = new NextRequest('http://localhost/api/comments/cmt-nope', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'cmt-nope' }) });
    expect(res.status).toBe(404);
  });
});
