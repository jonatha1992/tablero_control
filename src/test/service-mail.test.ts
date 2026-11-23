import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from '@/services/mail.service';

function mockJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('MailService (correo-central)', () => {
  const originalEnv = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.CORREO_API_KEY = 'cc_test_key_123';
    process.env.CORREO_CENTRAL_URL = 'https://correo.tecnofusion.dev';
    process.env.NEXT_PUBLIC_APP_URL = 'https://tablero.tecnofusion.dev';
    fetchMock = vi.fn().mockResolvedValue(
      mockJsonResponse(200, {
        id: 'q_123',
        from: 'Tablero de Control <avisos@tecnofusion.dev>',
        status: 'sent',
        replayed: false,
      })
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  function getLastRequest() {
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    return { url, init, body };
  }

  it('sendWelcomeEmail usa plantilla bienvenida con boton https', async () => {
    const res = await MailService.sendWelcomeEmail('ana@ejemplo.com', 'Ana');
    expect(res).toEqual({ success: true });

    const { url, init, body } = getLastRequest();
    expect(url).toBe('https://correo.tecnofusion.dev/v1/send');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer cc_test_key_123');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(body.to).toBe('ana@ejemplo.com');
    expect(body.template.id).toBe('bienvenida');
    expect(body.template.data.nombre).toBe('Ana');
    expect(body.template.data.boton).toEqual({
      texto: 'Acceder a mi Tablero',
      url: 'https://tablero.tecnofusion.dev/login',
    });
  });

  it('sendPasswordResetEmail usa plantilla aviso manteniendo el resetLink', async () => {
    const link = 'https://gestordetrabajo.firebaseapp.com/__/auth/action?oobCode=abc123';
    const res = await MailService.sendPasswordResetEmail('ana@ejemplo.com', link);
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.to).toBe('ana@ejemplo.com');
    expect(body.template.id).toBe('aviso');
    expect(body.template.data.titulo).toBe('Recupera tu acceso');
    expect(body.template.data.boton).toEqual({
      texto: 'Restablecer contraseña',
      url: link,
    });
  });

  it('sendInviteEmail usa plantilla aviso con resetLink cuando se provee', async () => {
    const resetLink = 'https://gestordetrabajo.firebaseapp.com/__/auth/action?oobCode=inv1';
    const res = await MailService.sendInviteEmail(
      'nuevo@ejemplo.com',
      'Jonatan',
      'Equipo Norte',
      'joni@ejemplo.com',
      resetLink
    );
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.template.id).toBe('aviso');
    expect(body.template.data.mensaje).toContain('Jonatan');
    expect(body.template.data.mensaje).toContain('Equipo Norte');
    expect(body.template.data.boton).toEqual({
      texto: 'Establecer contraseña',
      url: resetLink,
    });
  });

  it('sendInviteEmail usa inviteLinkOverride cuando no hay resetLink', async () => {
    const inviteUrl = 'https://tablero.tecnofusion.dev/i/tok-99';
    const res = await MailService.sendInviteEmail(
      'nuevo@ejemplo.com',
      'Jonatan',
      'Equipo Sur',
      undefined,
      undefined,
      inviteUrl
    );
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.template.id).toBe('aviso');
    expect(body.template.data.boton).toEqual({
      texto: 'Aceptar invitación',
      url: inviteUrl,
    });
  });

  it('sendSubscriptionExpiryEmail usa plantilla aviso con fecha y renewUrl', async () => {
    const res = await MailService.sendSubscriptionExpiryEmail('admin@negocio.com', {
      businessName: 'Cafe Central',
      planName: 'Pro',
      expiryDate: '30/11/2026',
      renewUrl: 'https://tablero.tecnofusion.dev/dashboard/billing',
      daysLeft: 3,
    });
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.template.id).toBe('aviso');
    expect(body.template.data.mensaje).toContain('Cafe Central');
    expect(body.template.data.mensaje).toContain('30/11/2026');
    expect(body.template.data.boton).toEqual({
      texto: 'Renovar suscripción',
      url: 'https://tablero.tecnofusion.dev/dashboard/billing',
    });
  });

  it('sendSubscriptionActivatedEmail usa plantilla aviso con boton al dashboard', async () => {
    const res = await MailService.sendSubscriptionActivatedEmail('admin@negocio.com', 'Cafe Central', 'Pro');
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.template.id).toBe('aviso');
    expect(body.template.data.mensaje).toContain('Pro');
    expect(body.template.data.mensaje).toContain('Cafe Central');
    expect(body.template.data.boton).toEqual({
      texto: 'Ir al dashboard',
      url: 'https://tablero.tecnofusion.dev/dashboard',
    });
  });

  it('sendPaymentSuccessEmail usa plantilla pago-recibido con campos requeridos', async () => {
    const res = await MailService.sendPaymentSuccessEmail('admin@negocio.com', 'Cafe Central', 15500);
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.template.id).toBe('pago-recibido');
    expect(body.template.data.moneda).toBe('ARS');
    expect(body.template.data.pagador).toBe('Cafe Central');
    expect(String(body.template.data.monto)).toContain('15.500');
    expect(body.template.data.fecha).toBeTruthy();
  });

  it('sendPaymentFailedEmail usa plantilla aviso con boton a facturacion', async () => {
    const res = await MailService.sendPaymentFailedEmail('admin@negocio.com', 'Cafe Central');
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.template.id).toBe('aviso');
    expect(body.template.data.mensaje).toContain('Cafe Central');
    expect(body.template.data.boton).toEqual({
      texto: 'Ir a facturación',
      url: 'https://tablero.tecnofusion.dev/dashboard/billing',
    });
  });

  it('sendTaskAssignedEmail usa plantilla aviso con tarea y asignador', async () => {
    const res = await MailService.sendTaskAssignedEmail('miembro@negocio.com', 'Revisar stock', 'Laura');
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.template.id).toBe('aviso');
    expect(body.template.data.mensaje).toContain('Laura');
    expect(body.template.data.mensaje).toContain('Revisar stock');
    expect(body.template.data.boton).toEqual({
      texto: 'Ver mis tareas',
      url: 'https://tablero.tecnofusion.dev/dashboard/tareas',
    });
  });

  it('sendEventReminderEmail usa plantilla aviso con eventsUrl', async () => {
    const res = await MailService.sendEventReminderEmail('miembro@negocio.com', {
      eventTitle: 'Reunion semanal',
      whenLabel: 'mañana',
      eventsUrl: 'https://tablero.tecnofusion.dev/dashboard/eventos',
    });
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.template.id).toBe('aviso');
    expect(body.template.data.mensaje).toContain('Reunion semanal');
    expect(body.template.data.boton).toEqual({
      texto: 'Ver eventos',
      url: 'https://tablero.tecnofusion.dev/dashboard/eventos',
    });
  });

  it('acepta 202 queued como envio exitoso', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(202, {
        id: 'q_queued',
        from: 'Tablero de Control <avisos@tecnofusion.dev>',
        status: 'queued',
        replayed: false,
      })
    );
    const res = await MailService.sendWelcomeEmail('ana@ejemplo.com', 'Ana');
    expect(res).toEqual({ success: true });
  });

  it('devuelve success false ante error HTTP de correo-central (422/429/401/502)', async () => {
    fetchMock.mockResolvedValueOnce(
      mockJsonResponse(422, { error: 'Recipient suppressed', code: 'RECIPIENT_SUPPRESSED' })
    );
    const res = await MailService.sendWelcomeEmail('rebotado@ejemplo.com', 'Ana');
    expect(res.success).toBe(false);
    expect(res.error).toContain('422');
  });

  it('devuelve success false si falta CORREO_API_KEY sin llamar a fetch', async () => {
    delete process.env.CORREO_API_KEY;
    const res = await MailService.sendWelcomeEmail('ana@ejemplo.com', 'Ana');
    expect(res.success).toBe(false);
    expect(res.error).toContain('CORREO_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('omite boton cuando la URL no es https para cumplir el esquema de correo-central', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    const res = await MailService.sendWelcomeEmail('ana@ejemplo.com', 'Ana');
    expect(res).toEqual({ success: true });

    const { body } = getLastRequest();
    expect(body.template.data.boton).toBeUndefined();
  });
});
