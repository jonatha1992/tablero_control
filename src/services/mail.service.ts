import { render } from '@react-email/render';
import React from 'react';
import { WelcomeEmail } from '@/lib/mail/templates/welcome-email';
import { ResetPasswordEmail } from '@/lib/mail/templates/reset-password-email';
import { TeamInviteEmail } from '@/lib/mail/templates/team-invite-email';
import { SubscriptionExpiryEmail } from '@/lib/mail/templates/subscription-expiry-email';
import { SubscriptionActivatedEmail } from '@/lib/mail/templates/subscription-activated-email';
import { PaymentSuccessEmail } from '@/lib/mail/templates/payment-success-email';
import { PaymentFailedEmail } from '@/lib/mail/templates/payment-failed-email';
import { TaskAssignedEmail } from '@/lib/mail/templates/task-assigned-email';
import { EventReminderEmail } from '@/lib/mail/templates/event-reminder-email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Resend: solo si RESEND_API_KEY está configurada (requiere dominio verificado).
// Sin dominio: dejar RESEND_API_KEY vacío/comentado y usar Gmail SMTP (GMAIL_USER).
const useResend = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'no-key');

async function sendMail(to: string, subject: string, html: string) {
  if (useResend) {
    const { resend } = await import('@/lib/resend');
    const FROM = `Tablero de Control <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
    const { error } = await resend.emails.send({ from: FROM, to: [to], subject, html });
    if (error) throw new Error(error.message);
  } else {
    const { mailer } = await import('@/lib/gmail');
    const FROM = `Tablero de Control <${process.env.GMAIL_USER ?? 'noreply@tablero.app'}>`;
    await mailer.sendMail({ from: FROM, to, subject, html, textEncoding: 'base64' });
  }
}

export class MailService {
  static async sendWelcomeEmail(to: string, userName: string) {
    try {
      const html = await render(React.createElement(WelcomeEmail, {
        userName,
        loginUrl: `${APP_URL}/login`,
      }));
      await sendMail(to, `¡Bienvenido a Tablero de Control, ${userName}!`, html);
      return { success: true };
    } catch (err) {
      console.error('Error enviando email de bienvenida:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  static async sendPasswordResetEmail(to: string, resetLink: string) {
    try {
      const html = await render(React.createElement(ResetPasswordEmail, { resetLink }));
      await sendMail(to, 'Recupera tu acceso - Tablero de Control', html);
      return { success: true };
    } catch (err) {
      console.error('Error enviando email de recuperación:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  static async sendInviteEmail(
    to: string,
    invitedBy: string,
    teamName: string,
    inviterEmail?: string,
    resetLink?: string,
    inviteLinkOverride?: string
  ) {
    try {
      const html = await render(React.createElement(TeamInviteEmail, {
        invitedByUsername: invitedBy,
        invitedByEmail: inviterEmail,
        teamName,
        inviteLink: inviteLinkOverride ?? `${APP_URL}/login`,
        resetLink,
      }));
      await sendMail(to, `Te han invitado a unirte a ${teamName}`, html);
      return { success: true };
    } catch (err) {
      console.error('Error enviando email de invitación:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  static async sendSubscriptionExpiryEmail(
    to: string,
    data: { businessName: string; planName: string; expiryDate: string; renewUrl: string; daysLeft: number }
  ) {
    try {
      const html = await render(React.createElement(SubscriptionExpiryEmail, data));
      await sendMail(to, `Tu suscripción vence en ${data.daysLeft} días`, html);
      return { success: true };
    } catch (err) {
      console.error('Error enviando email de expiración:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  static async sendSubscriptionActivatedEmail(to: string, businessName: string, planName: string) {
    try {
      const html = await render(React.createElement(SubscriptionActivatedEmail, { businessName, planName }));
      await sendMail(to, `Suscripción activada — ${businessName}`, html);
      return { success: true };
    } catch (err) {
      console.error('Error enviando email de suscripción activada:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  static async sendPaymentSuccessEmail(to: string, businessName: string, amount: number) {
    try {
      const html = await render(React.createElement(PaymentSuccessEmail, { businessName, amount }));
      await sendMail(to, `Pago recibido — ${businessName}`, html);
      return { success: true };
    } catch (err) {
      console.error('Error enviando email de pago exitoso:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  static async sendPaymentFailedEmail(to: string, businessName: string) {
    try {
      const html = await render(React.createElement(PaymentFailedEmail, { businessName }));
      await sendMail(to, `Problema con el pago — ${businessName}`, html);
      return { success: true };
    } catch (err) {
      console.error('Error enviando email de pago fallido:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  static async sendTaskAssignedEmail(to: string, taskTitle: string, assignerName: string) {
    try {
      const html = await render(React.createElement(TaskAssignedEmail, { taskTitle, assignerName }));
      await sendMail(to, `Nueva tarea asignada: ${taskTitle}`, html);
      return { success: true };
    } catch (err) {
      console.error('Error enviando email de tarea asignada:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  static async sendEventReminderEmail(
    to: string,
    data: { eventTitle: string; whenLabel: 'mañana' | 'hoy' | 'pasó'; eventsUrl: string },
  ) {
    try {
      const html = await render(React.createElement(EventReminderEmail, data));
      await sendMail(to, `📅 Evento ${data.whenLabel}`, html);
      return { success: true };
    } catch (err) {
      console.error('Error enviando email de recordatorio de evento:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
