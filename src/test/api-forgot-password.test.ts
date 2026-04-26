import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/forgot-password/route';
import { MailService } from '@/services/mail.service';

const mockGenerateLink = vi.fn().mockResolvedValue('https://reset.link/token');

vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: vi.fn(() => ({
    generatePasswordResetLink: mockGenerateLink,
  })),
}));

vi.mock('@/services/mail.service', () => ({
  MailService: {
    sendPasswordResetEmail: vi.fn(),
  },
}));

const mockSendEmail = vi.mocked(MailService.sendPasswordResetEmail);

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateLink.mockResolvedValue('https://reset.link/token');
  mockSendEmail.mockResolvedValue({ success: true, data: { id: 'test-email-id' }, error: undefined });
});

describe('POST /api/auth/forgot-password', () => {
  it('retorna 400 si el email es inválido', async () => {
    const req = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'no-es-un-email' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('email_invalid');
  });

  it('retorna 400 si el email está vacío', async () => {
    const req = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('envía el email y retorna 200', async () => {
    const req = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'usuario@ejemplo.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith('usuario@ejemplo.com', 'https://reset.link/token');
  });

  it('retorna 500 si el envío de email falla', async () => {
    mockSendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP error' });
    const req = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'usuario@ejemplo.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('send_failed');
  });

  it('retorna 200 aunque el usuario no exista (evita enumeración)', async () => {
    mockGenerateLink.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    const req = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'noexiste@ejemplo.com' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
