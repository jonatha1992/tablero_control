import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { handle } from '@/lib/api/route-handler';
import { chatWithAssistant } from '@/lib/groq/assistant';
import type { AssistantMessage, AssistantMode } from '@/lib/groq/assistant';
import { buildAssistantContext } from '@/lib/assistant-context';

export const maxDuration = 30;

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  let body: { messages?: AssistantMessage[]; mode?: AssistantMode };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages_required' }, { status: 400 });
  }

  const businessName = user.data.memberships?.find(
    (m) => m.businessId === user.businessId,
  )?.businessName;

  const ctx = await buildAssistantContext({
    businessId: user.businessId,
    userName: user.data.name,
    userRole: user.role,
    businessName,
  });

  const mode = body.mode ?? 'assistant';

  try {
    const result = await chatWithAssistant(messages, ctx, mode);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[assistant/chat]', err);
    return NextResponse.json({ error: 'chat_failed' }, { status: 500 });
  }
});
