import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireActiveSubscription } from '@/lib/api/auth-helpers';
import { extractTasksFromTranscription } from '@/lib/groq/extract-tasks';
import { loadExtractContext, type ExtractContext } from '@/lib/groq/extract-context';
import { handle } from '@/lib/api/route-handler';

export const maxDuration = 30;

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  const subDenied = requireActiveSubscription(user, request);
  if (subDenied) return subDenied;

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: 'text_required' }, { status: 400 });
  }

  let extractCtx: ExtractContext = {
    members: [],
    locations: [],
    projects: [],
    cycles: [],
    objectives: [],
    siteLabel: 'Sede',
    today: new Date().toISOString().split('T')[0],
  };
  if (user.businessId) {
    try {
      extractCtx = await loadExtractContext(user.businessId);
    } catch {
      // non-fatal
    }
  }

  let tasks: Awaited<ReturnType<typeof extractTasksFromTranscription>>;
  try {
    tasks = await extractTasksFromTranscription(text, extractCtx);
  } catch (err) {
    // Un fallo del proveedor no es "no te entendi": se responde como error real
    // para que la UI no culpe al usuario por un problema de infraestructura.
    console.error('[from-text] Task extraction failed', err);
    return NextResponse.json({ error: 'extraction_failed' }, { status: 502 });
  }

  return NextResponse.json({ tasks, parseError: false });
});
