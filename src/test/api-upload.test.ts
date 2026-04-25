import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/upload/route';
import { requireUser } from '@/lib/api/auth-helpers';
import { uploadUserAvatar, uploadTaskAttachment } from '@/lib/cloudinary/upload';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/api/audit';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@/lib/cloudinary/upload', () => ({
  uploadUserAvatar: vi.fn(),
  uploadTaskAttachment: vi.fn(),
}));

vi.mock('@/lib/api/audit', () => ({
  writeAuditLog: vi.fn(),
}));

const mockRequireUser = vi.mocked(requireUser);
const mockUploadAvatar = vi.mocked(uploadUserAvatar);
const mockUploadAttachment = vi.mocked(uploadTaskAttachment);
const mockWriteAuditLog = vi.mocked(writeAuditLog);

const authedUser = {
  uid: 'user-1',
  role: 'miembro' as const,
  businessId: 'biz-1',
  email: 'user@biz.com',
  name: 'Usuario',
  data: {} as never,
};

function makeFormDataRequest(fields: Record<string, string | File>): NextRequest {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return new NextRequest('http://localhost/api/upload', { method: 'POST', body: formData });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(authedUser as never);
});

describe('POST /api/upload', () => {
  it('retorna 401 si no está autenticado', async () => {
    mockRequireUser.mockResolvedValueOnce(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as never);
    const req = makeFormDataRequest({ type: 'avatar', id: 'user-1', file: new File([''], 'avatar.jpg') });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 si faltan campos requeridos', async () => {
    const formData = new FormData();
    formData.append('type', 'avatar');
    const req = new NextRequest('http://localhost/api/upload', { method: 'POST', body: formData });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing/i);
  });

  it('retorna 400 para tipo de upload inválido', async () => {
    const req = makeFormDataRequest({
      type: 'invalid_type',
      id: 'user-1',
      file: new File(['data'], 'file.jpg'),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid/i);
  });

  it('sube avatar y retorna la URL', async () => {
    mockUploadAvatar.mockResolvedValueOnce('https://cloudinary.com/avatar.jpg');
    const req = makeFormDataRequest({
      type: 'avatar',
      id: 'user-1',
      file: new File(['img'], 'avatar.jpg', { type: 'image/jpeg' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://cloudinary.com/avatar.jpg');
    expect(mockUploadAvatar).toHaveBeenCalledWith('user-1', expect.any(File));
  });

  it('sube attachment, crea registro en DB y escribe audit log', async () => {
    mockUploadAttachment.mockResolvedValueOnce({
      secure_url: 'https://cloudinary.com/file.pdf',
      public_id: 'tasks/task-1/file',
    } as never);
    vi.mocked(prisma.attachment.create).mockResolvedValueOnce({} as never);

    const req = makeFormDataRequest({
      type: 'attachment',
      id: 'task-1',
      fileName: 'informe.pdf',
      file: new File(['content'], 'informe.pdf', { type: 'application/pdf' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://cloudinary.com/file.pdf');
    expect(prisma.attachment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ taskId: 'task-1', filename: 'informe.pdf' }) })
    );
    expect(mockWriteAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'attachment.upload' }));
  });
});
