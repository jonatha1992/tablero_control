import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { teamService } from '@/services/team.service';
import { extractTasksFromTranscription } from '@/lib/groq/extract-tasks';
import { handle } from '@/lib/api/route-handler';

export const maxDuration = 30;

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

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

  const members: { id: string; name: string }[] = [];
  if (user.businessId) {
    try {
      const allMembers = await teamService.getMembersByBusiness(user.businessId);
      members.push(...allMembers.map((m) => ({ id: m.id, name: m.name })));
    } catch {
      // non-fatal
    }
  }

  let tasks: Awaited<ReturnType<typeof extractTasksFromTranscription>>;
  let parseError = false;
  try {
    tasks = await extractTasksFromTranscription(text, members);
  } catch (err) {
    console.error('[from-text] Task extraction failed', err);
    tasks = [];
    parseError = true;
  }

  return NextResponse.json({ tasks, parseError });
});
