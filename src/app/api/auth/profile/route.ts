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
      // Check if user was invited (exists by email but with a different ID)
      const existingByEmail = await userRepository.findByEmail(decoded.email);
      if (existingByEmail) {
        try {
          user = await userRepository.updateId(existingByEmail.id, decoded.uid);
          
          // If the invited user doesn't have an avatar but Google provided one, update it
          if (!user.avatar && decoded.picture) {
            user = await userRepository.update(user.id, { avatar: decoded.picture });
          }
        } catch (e) {
          console.error('Error linking invited user:', e);
        }
      }
    }

    if (!user) {
      const email = decoded.email ?? '';
      const name = decoded.name ?? email.split('@')[0] ?? 'Usuario';
      const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? '').split(',').map(e => e.trim());
      const isSuperadmin = superadminEmails.includes(email);
      const role = isSuperadmin ? 'superadmin' : 'admin';
      
      let businessId = undefined;

      if (!isSuperadmin) {
        // Create business for the new admin
        const business = await businessRepository.create({
          name: `Negocio de ${name}`,
          adminId: decoded.uid,
          plan: 'free',
          status: 'active',
          settings: {
            theme: 'system',
            language: 'es',
            timezone: 'America/Argentina/Buenos_Aires',
            notifications: {
              email: true,
            },
            features: {
              customBranding: false,
              advancedReports: false,
              apiAccess: false,
            },
          },
          featureFlags: {},
          locationIds: [],
          teamIds: [],
        });
        businessId = business.id;
      }

      user = await userRepository.create({
        id: decoded.uid,
        email,
        name,
        role,
        businessId,
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
  } catch (error) {
    console.error('Profile fetch/create error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
