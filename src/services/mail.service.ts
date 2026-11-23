import { sendCorreoCentral, type CorreoButton, type CorreoTemplate } from '@/lib/correo-central';

function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function buildHttpsButton(texto: string, url: string): CorreoButton | undefined {
  return url.startsWith('https://') ? { texto, url } : undefined;
}

function formatArDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

const EVENT_COPY_BY_LABEL: Record<'mañana' | 'hoy' | 'pasó', string> = {
  mañana: 'Tenés un evento programado para mañana.',
  hoy: 'Tenés un evento programado para hoy.',
  pasó: 'Tu evento quedó marcado como pasado.',
};

async function dispatchTemplate(
  to: string,
  subject: string,
  template: CorreoTemplate,
  errorLabel: string,
): Promise<{ success: true; error?: undefined } | { success: false; error: string }> {
  try {
    await sendCorreoCentral({ to, subject, template });
    return { success: true };
  } catch (err) {
    console.error(`Error enviando ${errorLabel}:`, err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export class MailService {
  static async sendWelcomeEmail(to: string, userName: string) {
    const loginUrl = `${getAppUrl()}/login`;
    const boton = buildHttpsButton('Acceder a mi Tablero', loginUrl);
    const mensaje = boton
      ? 'Tu cuenta fue creada exitosamente y ya podés empezar a organizar tus tareas y equipos en Tablero de Control.'
      : `Tu cuenta fue creada exitosamente y ya podés empezar a organizar tus tareas y equipos en Tablero de Control.
Ingresá en: ${loginUrl}`;

    return dispatchTemplate(
      to,
      `Bienvenido a Tablero de Control, ${userName}`,
      {
        id: 'bienvenida',
        data: { nombre: userName, mensaje, ...(boton ? { boton } : {}) },
      },
      'email de bienvenida',
    );
  }

  static async sendPasswordResetEmail(to: string, resetLink: string) {
    const boton = buildHttpsButton('Restablecer contraseña', resetLink);
    const lines = [
      'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Tablero de Control.',
      'Si no realizaste esta solicitud, podés ignorar este correo de forma segura.',
      'Este enlace expirará en una hora por motivos de seguridad.',
    ];
    if (!boton) lines.push(`Enlace de recuperación: ${resetLink}`);

    return dispatchTemplate(
      to,
      'Recupera tu acceso - Tablero de Control',
      {
        id: 'aviso',
        data: {
          titulo: 'Recupera tu acceso',
          mensaje: lines.join('\n'),
          ...(boton ? { boton } : {}),
        },
      },
      'email de recuperación',
    );
  }

  static async sendInviteEmail(
    to: string,
    invitedBy: string,
    teamName: string,
    inviterEmail?: string,
    resetLink?: string,
    inviteLinkOverride?: string,
  ) {
    const inviteLink = inviteLinkOverride ?? `${getAppUrl()}/login`;
    const inviterLabel = inviterEmail ? `${invitedBy} (${inviterEmail})` : invitedBy;
    const primaryUrl = resetLink ?? inviteLink;
    const boton = buildHttpsButton(
      resetLink ? 'Establecer contraseña' : 'Aceptar invitación',
      primaryUrl,
    );

    const lines = [
      `${inviterLabel} te invitó a formar parte del equipo de ${teamName} en Tablero de Control.`,
    ];
    if (resetLink) {
      lines.push('Para acceder, primero establecé tu contraseña con el botón de abajo.');
      lines.push(`También podés iniciar sesión con tu cuenta de Google en ${inviteLink}.`);
    }
    if (!boton) lines.push(`Enlace de acceso: ${primaryUrl}`);
    lines.push('Si no esperabas esta invitación, podés ignorar este correo.');

    return dispatchTemplate(
      to,
      `Te han invitado a unirte a ${teamName}`,
      {
        id: 'aviso',
        data: {
          titulo: 'Te invitaron a unirte al equipo',
          mensaje: lines.join('\n'),
          ...(boton ? { boton } : {}),
        },
      },
      'email de invitación',
    );
  }

  static async sendSubscriptionExpiryEmail(
    to: string,
    data: { businessName: string; planName: string; expiryDate: string; renewUrl: string; daysLeft: number },
  ) {
    const dayWord = data.daysLeft === 1 ? 'día restante' : 'días restantes';
    const boton = buildHttpsButton('Renovar suscripción', data.renewUrl);
    const lines = [
      `El plan ${data.planName} de ${data.businessName} vence el ${data.expiryDate} (${data.daysLeft} ${dayWord}).`,
      'Para continuar usando Tablero de Control sin interrupciones, renová tu suscripción antes de esa fecha.',
      'Si ya realizaste el pago, podés ignorar este mensaje.',
    ];
    if (!boton) lines.push(`Renovar en: ${data.renewUrl}`);

    return dispatchTemplate(
      to,
      `Tu suscripción vence en ${data.daysLeft} días`,
      {
        id: 'aviso',
        data: {
          titulo: 'Tu suscripción está por vencer',
          mensaje: lines.join('\n'),
          ...(boton ? { boton } : {}),
        },
      },
      'email de expiración',
    );
  }

  static async sendSubscriptionActivatedEmail(to: string, businessName: string, planName: string) {
    const dashboardUrl = `${getAppUrl()}/dashboard`;
    const boton = buildHttpsButton('Ir al dashboard', dashboardUrl);
    const lines = [
      `El plan ${planName} de ${businessName} fue activado exitosamente.`,
      'Ya podés usar todas las funciones incluidas en tu plan.',
    ];
    if (!boton) lines.push(`Ir al dashboard: ${dashboardUrl}`);

    return dispatchTemplate(
      to,
      `Suscripción activada — ${businessName}`,
      {
        id: 'aviso',
        data: {
          titulo: 'Suscripción activada',
          mensaje: lines.join('\n'),
          ...(boton ? { boton } : {}),
        },
      },
      'email de suscripción activada',
    );
  }

  static async sendPaymentSuccessEmail(to: string, businessName: string, amount: number) {
    const monto = amount.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return dispatchTemplate(
      to,
      `Pago recibido — ${businessName}`,
      {
        id: 'pago-recibido',
        data: {
          monto,
          moneda: 'ARS',
          pagador: businessName,
          fecha: formatArDateTime(new Date()),
        },
      },
      'email de pago exitoso',
    );
  }

  static async sendPaymentFailedEmail(to: string, businessName: string) {
    const billingUrl = `${getAppUrl()}/dashboard/billing`;
    const boton = buildHttpsButton('Ir a facturación', billingUrl);
    const lines = [
      `No pudimos procesar el pago de la suscripción de ${businessName}.`,
      'Esto puede deberse a fondos insuficientes, tarjeta vencida u otro problema con tu método de pago.',
      'Para evitar la suspensión de tu cuenta, actualizá tu método de pago desde el panel de facturación.',
    ];
    if (!boton) lines.push(`Ir a facturación: ${billingUrl}`);

    return dispatchTemplate(
      to,
      `Problema con el pago — ${businessName}`,
      {
        id: 'aviso',
        data: {
          titulo: 'Problema con el pago',
          mensaje: lines.join('\n'),
          ...(boton ? { boton } : {}),
        },
      },
      'email de pago fallido',
    );
  }

  static async sendTaskAssignedEmail(to: string, taskTitle: string, assignerName: string) {
    const tasksUrl = `${getAppUrl()}/dashboard/tareas`;
    const boton = buildHttpsButton('Ver mis tareas', tasksUrl);
    const lines = [`${assignerName} te asignó la siguiente tarea:`, taskTitle];
    if (!boton) lines.push(`Ver tareas: ${tasksUrl}`);

    return dispatchTemplate(
      to,
      `Nueva tarea asignada: ${taskTitle}`,
      {
        id: 'aviso',
        data: {
          titulo: 'Te asignaron una tarea',
          mensaje: lines.join('\n'),
          ...(boton ? { boton } : {}),
        },
      },
      'email de tarea asignada',
    );
  }

  static async sendEventReminderEmail(
    to: string,
    data: { eventTitle: string; whenLabel: 'mañana' | 'hoy' | 'pasó'; eventsUrl: string },
  ) {
    const boton = buildHttpsButton('Ver eventos', data.eventsUrl);
    const lines = [EVENT_COPY_BY_LABEL[data.whenLabel], `Evento: ${data.eventTitle}`];
    if (!boton) lines.push(`Ver eventos: ${data.eventsUrl}`);

    return dispatchTemplate(
      to,
      `Recordatorio de evento (${data.whenLabel}): ${data.eventTitle}`,
      {
        id: 'aviso',
        data: {
          titulo: 'Recordatorio de evento',
          mensaje: lines.join('\n'),
          ...(boton ? { boton } : {}),
        },
      },
      'email de recordatorio de evento',
    );
  }
}
