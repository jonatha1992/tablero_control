import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY no está configurada. Los correos no se enviarán.');
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? 'no-key');
