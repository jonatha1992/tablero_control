import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { initSystemRoles } from '@/lib/firebase/init-system-roles';

export async function POST(req: NextRequest) {
  const result = await requireUser(req);
  if (result instanceof NextResponse) return result;
  if (!result.businessId) {
    return NextResponse.json({ error: 'Sin business' }, { status: 400 });
  }
  await initSystemRoles(result.businessId);
  return NextResponse.json({ ok: true });
}
