import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase/admin';
import { userRepository, businessRepository } from '@/repositories';

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyToken(token);
    let user = await userRepository.findById(decoded.uid);

    if (!user && decoded.email) {
      // Invited user: exists by email but has a different Firebase UID
      const existingByEmail = await userRepository.findByEmail(decoded.email);
      if (existingByEmail) {
        try {
          user = await userRepository.updateId(existingByEmail.id, decoded.uid);
          if (!user.avatar && decoded.picture) {
            user = await userRepository.update(user.id, { avatar: decoded.picture });
          }
        } catch (e) {
          console.error('Error linking invited user:', e);
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'not_invited' }, { status: 404 });
    }

    // Fix for existing users without businessId
    if (!user.businessId) {
      const email = decoded.email ?? '';
      const name = decoded.name ?? email.split('@')[0] ?? 'Usuario';
      const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? '').split(',').map(e => e.trim());
      const isSuperadmin = superadminEmails.includes(email);

      const business = await businessRepository.create({
        name: isSuperadmin ? 'TecnoFusión (Master)' : `Negocio de ${name}`,
        adminId: decoded.uid,
        plan: 'free',
        status: 'active',
        settings: {
          maxLocations: 1,
          maxUsers: 5,
          theme: 'system',
          language: 'es',
          timezone: 'America/Argentina/Buenos_Aires',
          notifications: { email: true },
          features: { customBranding: false, advancedReports: false, apiAccess: false },
          localeTypes: [],
        },
        featureFlags: {},
        locationIds: [],
        teamIds: [],
      });
      user = await userRepository.update(user.id, { businessId: business.id });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
