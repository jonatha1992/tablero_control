import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { MailService } from '@/services/mail.service';
import { handle } from '@/lib/api/route-handler';

export const POST = handle(async (req: NextRequest) => {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'email_invalid' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();

    // 1. Generar el link oficial de Firebase
    // Nota: ActionCodeSettings opcional para redirección personalizada
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
    });

    // 2. Enviar el correo usando nuestro propio template y Resend
    const { success, error } = await MailService.sendPasswordResetEmail(email, resetLink);

    if (!success) {
      console.error('MailService error:', error);
      return NextResponse.json({ error: 'send_failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email enviado correctamente' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const code = (err as { code?: string }).code;
    console.error('Forgot Password Error:', message);

    // Si el usuario no existe, por seguridad solemos devolver 200 para evitar enumeración,
    // pero aquí devolvemos el error específico si prefieres manejarlo en UI.
    if (code === 'auth/user-not-found') {
      return NextResponse.json({ success: true, message: 'Si el correo existe, recibirá un link' });
    }

    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
});
