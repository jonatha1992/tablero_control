import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api/route-handler', () => ({
  handle: (fn: (req: NextRequest) => Promise<Response>) => fn,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET as resolveGET } from '@/app/api/auth/resolve/route';
import { prisma } from '@/lib/prisma';

describe('GET /api/auth/resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 400 si falta login', async () => {
    const req = new NextRequest('http://localhost/api/auth/resolve');
    const res = await resolveGET(req);
    expect(res.status).toBe(400);
  });

  it('resuelve username sin requerir autenticación', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      email: 'juan.garcia@guest.local',
    } as never);

    const req = new NextRequest('http://localhost/api/auth/resolve?login=juan.garcia');
    const res = await resolveGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('juan.garcia@guest.local');
  });

  it('resuelve por nombre cuando hay un único match', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      { email: 'juan.garcia@guest.local' },
    ] as never);

    const req = new NextRequest('http://localhost/api/auth/resolve?login=Juan%20Garc%C3%ADa');
    const res = await resolveGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('juan.garcia@guest.local');
  });

  it('retorna 409 si hay varios usuarios con el mismo nombre', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      { email: 'a@guest.local' },
      { email: 'b@guest.local' },
    ] as never);

    const req = new NextRequest('http://localhost/api/auth/resolve?login=Juan%20Garc%C3%ADa');
    const res = await resolveGET(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('ambiguous_login');
  });

  it('retorna 404 si no hay coincidencias', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([] as never);

    const req = new NextRequest('http://localhost/api/auth/resolve?login=nadie');
    const res = await resolveGET(req);
    expect(res.status).toBe(404);
  });
});
