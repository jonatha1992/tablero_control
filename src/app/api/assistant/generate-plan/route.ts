import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { handle } from '@/lib/api/route-handler';
import { generatePlanFromDescription } from '@/lib/groq/generate-plan';
import { cycleRepository, objectiveRepository, taskRepository } from '@/repositories';
import { writeAuditLog } from '@/lib/api/audit';

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

  const businessId = user.businessId;
  if (!businessId) {
    return NextResponse.json({ error: 'no_business' }, { status: 403 });
  }

  const plan = await generatePlanFromDescription(type, description.trim());
  const today = new Date().toISOString().split('T')[0];

  const createdTaskIds: string[] = [];
  const taskTitles: string[] = [];

  if (type === 'cycle') {
    const cycle = await cycleRepository.create({
      name: plan.name,
      goal: plan.goal,
      businessId,
      status: 'planning',
      startDate: plan.startDate ? new Date(plan.startDate) : new Date(today),
      endDate: plan.endDate ? new Date(plan.endDate) : undefined,
    });

    for (const t of plan.tasks) {
      const task = await taskRepository.create({
        title: t.title,
        status: 'todo',
        priority: t.priority,
        type: 'task',
        assigneeIds: [],
        tags: t.tags ?? [],
        estimatedHours: t.estimatedHours,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        cycleId: cycle.id,
        creatorId: user.uid,
        businessId,
      });
      createdTaskIds.push(task.id);
      taskTitles.push(task.title);
    }

    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId,
      action: 'cycle.create',
      targetType: 'cycle',
      targetId: cycle.id,
      metadata: { source: 'ai_assistant', tasksCreated: createdTaskIds.length },
    });

    return NextResponse.json({
      type: 'cycle',
      name: cycle.name,
      id: cycle.id,
      tasksCreated: createdTaskIds.length,
      taskTitles,
    });
  } else {
    const objective = await objectiveRepository.create({
      name: plan.name,
      description: plan.goal,
      businessId,
      targetDate: plan.targetDate ? new Date(plan.targetDate) : undefined,
    });

    for (const t of plan.tasks) {
      const task = await taskRepository.create({
        title: t.title,
        status: 'todo',
        priority: t.priority,
        type: 'task',
        assigneeIds: [],
        tags: t.tags ?? [],
        estimatedHours: t.estimatedHours,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        creatorId: user.uid,
        businessId,
      });
      createdTaskIds.push(task.id);
      taskTitles.push(task.title);
    }

    if (createdTaskIds.length > 0) {
      await objectiveRepository.assignTasks(objective.id, createdTaskIds);
    }

    await writeAuditLog({
      actorId: user.uid,
      actorRole: user.role,
      businessId,
      action: 'objective.create',
      targetType: 'objective',
      targetId: objective.id,
      metadata: { source: 'ai_assistant', tasksCreated: createdTaskIds.length },
    });

    return NextResponse.json({
      type: 'objective',
      name: objective.name,
      id: objective.id,
      tasksCreated: createdTaskIds.length,
      taskTitles,
    });
  }
});
