import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { userRepository } from '@/repositories';

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyToken(token);
    let user = await userRepository.findById(decoded.uid);

    if (!user) {
      const email = decoded.email ?? '';
      const name = decoded.name ?? email.split('@')[0] ?? 'Usuario';
      const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? '').split(',').map(e => e.trim());
      const role = superadminEmails.includes(email) ? 'superadmin' : 'miembro';
      user = await userRepository.create({
        id: decoded.uid,
        email,
        name,
        role,
        avatar: decoded.picture ?? undefined,
        teamIds: [],
        preferences: {
          theme: 'system',
          locale: 'es',
          timezone: 'America/Argentina/Buenos_Aires',
          notifications: { email: true, push: true, agentReports: true, agentAlerts: true },
          dashboardLayout: [],
        },
        isActive: true,
      } as Parameters<typeof userRepository.create>[0]);
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
