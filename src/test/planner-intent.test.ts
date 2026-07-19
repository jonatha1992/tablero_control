import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlannerIntentResult } from '@/lib/groq/planner-intent';
import type { ExtractContext } from '@/lib/groq/extract-context';

vi.mock('@/lib/groq/extract-tasks', () => ({
  extractTasksFromTranscription: vi.fn().mockResolvedValue([
    { title: 'Revisar informe', priority: 'medium', status: 'todo', type: 'task', assigneeIds: [], tags: [], order: 1 },
  ]),
}));

vi.mock('@/lib/groq/extract-events', () => ({
  extractEventsFromText: vi.fn().mockResolvedValue([
    { title: 'Examen', startDate: '2026-07-25', allDay: true, assigneeIds: [], order: 1 },
  ]),
}));

vi.mock('@/lib/groq/generate-plan', () => ({
  generatePlanFromDescription: vi.fn().mockResolvedValue({
    name: 'Sprint 1',
    goal: 'Meta',
    tasks: [{ title: 'T1', priority: 'medium', estimatedHours: 2, tags: [] }],
  }),
}));

import { runIntentPipeline } from '@/lib/groq/planner-tools';

const baseCtx: ExtractContext = {
  members: [],
  locations: [],
  projects: [{ id: 'p1', name: 'Principal' }],
  cycles: [],
  objectives: [],
  defaultProjectId: 'p1',
  siteLabel: 'Sede',
  today: '2026-05-30',
};

describe('runIntentPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve clarify cuando faltan slots', async () => {
    const intent: PlannerIntentResult = {
      intent: 'create_task',
      confidence: 0.5,
      missingSlots: ['title'],
      clarificationQuestion: '¿Qué tarea querés crear?',
      suggestedOptions: ['Para hoy'],
    };
    const result = await runIntentPipeline(intent, baseCtx);
    expect(result.type).toBe('clarify');
    if (result.type === 'clarify') {
      expect(result.question).toContain('tarea');
    }
  });

  it('devuelve preview_tasks para create_task', async () => {
    const intent: PlannerIntentResult = {
      intent: 'create_task',
      confidence: 0.9,
      extractionText: 'Revisar informe mensual',
      missingSlots: [],
    };
    const result = await runIntentPipeline(intent, baseCtx);
    expect(result.type).toBe('preview_tasks');
    if (result.type === 'preview_tasks') {
      expect(result.tasks.length).toBeGreaterThan(0);
    }
  });

  it('devuelve preview_events para create_event', async () => {
    const intent: PlannerIntentResult = {
      intent: 'create_event',
      confidence: 0.9,
      extractionText: 'Examen final el viernes',
      missingSlots: [],
    };
    const result = await runIntentPipeline(intent, baseCtx);
    expect(result.type).toBe('preview_events');
    if (result.type === 'preview_events') {
      expect(result.events.length).toBeGreaterThan(0);
    }
  });

  it('clarify Evento|Tarea cuando intent unknown con pregunta de tipo', async () => {
    const intent: PlannerIntentResult = {
      intent: 'unknown',
      confidence: 0.4,
      missingSlots: ['kind'],
      clarificationQuestion: '¿Lo anoto como evento o como tarea?',
      suggestedOptions: ['Evento', 'Tarea'],
    };
    const result = await runIntentPipeline(intent, baseCtx);
    expect(result.type).toBe('clarify');
    if (result.type === 'clarify') {
      expect(result.question).toBe('¿Lo anoto como evento o como tarea?');
      expect(result.field).toBe('kind');
      expect(result.options).toEqual(['Evento', 'Tarea']);
    }
  });
});
