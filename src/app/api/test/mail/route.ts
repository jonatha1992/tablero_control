import { NextRequest, NextResponse } from 'next/server';
import { MailService } from '@/services/mail.service';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, action, userName, invitedBy, teamName } = await req.json();

    if (!email || !action) {
      return NextResponse.json({ error: 'Missing email or action' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'welcome':
        result = await MailService.sendWelcomeEmail(email, userName || 'Usuario de Prueba');
        break;
      
      case 'reset':
        // En este caso, para el test, generamos un link real si el usuario existe,
        // o uno ficticio si solo queremos ver el diseño.
        let resetLink = 'https://ejemplo.com/reset-password?token=test-token';
        try {
            const adminAuth = getAdminAuth();
            resetLink = await adminAuth.generatePasswordResetLink(email);
        } catch (e) {
            console.log('Usando link ficticio para el test de diseño');
        }
        result = await MailService.sendPasswordResetEmail(email, resetLink);
        break;

      case 'invite':
        result = await MailService.sendInviteEmail(
            email, 
            invitedBy || 'Admin de Prueba', 
            teamName || 'Negocio de Prueba'
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: `Email ${action} enviado` });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
