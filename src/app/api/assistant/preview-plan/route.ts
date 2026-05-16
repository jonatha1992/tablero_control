import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { handle } from '@/lib/api/route-handler';
import { generatePlanFromDescription } from '@/lib/groq/generate-plan';

export const maxDuration = 30;

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  let body: { type?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { type, description } = body;

  if (type !== 'cycle' && type !== 'objective') {
    return NextResponse.json({ error: 'type must be cycle or objective' }, { status: 400 });
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return NextResponse.json({ error: 'description required' }, { status: 400 });
  }
  if (description.length > 500) {
    return NextResponse.json({ error: 'description too long' }, { status: 400 });
  }

  if (!user.businessId) {
    return NextResponse.json({ error: 'no_business' }, { status: 403 });
  }

  const plan = await generatePlanFromDescription(type, description.trim());
  return NextResponse.json({ type, description, plan });
});
