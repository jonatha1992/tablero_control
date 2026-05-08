import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { handle } from '@/lib/api/route-handler';
import { chatWithAssistant } from '@/lib/groq/assistant';
import type { AssistantMessage, AssistantContext, TaskSummary } from '@/lib/groq/assistant';
import { taskRepository, cycleRepository } from '@/repositories/index';

export const maxDuration = 30;

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  let body: { messages?: AssistantMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages_required' }, { status: 400 });
  }

  const businessId = user.businessId;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  let taskSummaries: TaskSummary[] = [];
  let activeCycleName: string | undefined;

  if (businessId) {
    try {
      const [tasks, cycles] = await Promise.all([
        taskRepository.findAll(businessId),
        cycleRepository.findByBusiness(businessId),
      ]);

      const cycleMap = new Map(cycles.map((c) => [c.id, c.name]));
      activeCycleName = cycles.find((c) => c.status === 'active')?.name;

      // Limitar a 100 tareas más relevantes (no-done primero, luego done recientes)
      const sorted = [
        ...tasks.filter((t) => t.status !== 'done'),
        ...tasks.filter((t) => t.status === 'done').slice(0, 20),
      ].slice(0, 100);

      taskSummaries = sorted.map((t): TaskSummary => {
        const dueDateStr = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : undefined;
        return {
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: dueDateStr,
          assignees: (t.assignees ?? []).map((a) => a.name),
          cycleName: t.cycleId ? cycleMap.get(t.cycleId) : undefined,
          isOverdue: !!dueDateStr && dueDateStr < today && t.status !== 'done',
        };
      });
    } catch {
      // non-fatal
    }
  }

  const businessName = user.data.memberships?.find(
    (m) => m.businessId === businessId,
  )?.businessName;

  const ctx: AssistantContext = {
    userName: user.data.name,
    userRole: user.role,
    businessName,
    activeCycleName,
    tasks: taskSummaries,
    today,
  };

  void now;

  let result: Awaited<ReturnType<typeof chatWithAssistant>>;
  try {
    result = await chatWithAssistant(messages, ctx);
  } catch (err) {
    console.error('[assistant/chat] Error:', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }

  return NextResponse.json(result);
});
