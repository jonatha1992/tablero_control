import { resend } from '@/lib/resend';
import { WelcomeEmail } from '@/lib/mail/templates/welcome-email';
import { ResetPasswordEmail } from '@/lib/mail/templates/reset-password-email';
import { TeamInviteEmail } from '@/lib/mail/templates/team-invite-email';
import React from 'react';

const FROM_EMAIL = 'onboarding@resend.dev'; // Cambiar por dominio verificado en producción
const FROM_NAME = 'Tablero de Control';

export class MailService {
  /**
   * Envía un correo de bienvenida a un nuevo usuario.
   */
  static async sendWelcomeEmail(to: string, userName: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: `¡Bienvenido a Tablero de Control, ${userName}!`,
        react: React.createElement(WelcomeEmail, {
          userName,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
        }),
      });

      if (error) {
        console.error('Error enviando email de bienvenida:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Excepción en MailService.sendWelcomeEmail:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Envía un correo de recuperación de contraseña.
   */
  static async sendPasswordResetEmail(to: string, resetLink: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: 'Recupera tu acceso - Tablero de Control',
        react: React.createElement(ResetPasswordEmail, {
          resetLink,
        }),
      });

      if (error) {
        console.error('Error enviando email de recuperación:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Excepción en MailService.sendPasswordResetEmail:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Envía una invitación para unirse al equipo.
   */
  static async sendInviteEmail(to: string, invitedBy: string, teamName: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: `Te han invitado a unirte a ${teamName}`,
        react: React.createElement(TeamInviteEmail, {
          invitedByUsername: invitedBy,
          teamName: teamName,
          inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
        }),
      });

      if (error) {
        console.error('Error enviando email de invitación:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Excepción en MailService.sendInviteEmail:', err);
      return { success: false, error: err };
    }
  }
}
