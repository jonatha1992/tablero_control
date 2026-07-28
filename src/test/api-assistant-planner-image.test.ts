import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { PLANNER_IMAGE_MAX_BYTES } from '@/lib/ai/planner-image-contract';

vi.mock('@/lib/api/route-handler', () => ({
  handle: (fn: (req: NextRequest) => Promise<NextResponse>) => fn,
}));

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@/lib/groq/extract-context', () => ({
  loadExtractContext: vi.fn(),
}));

vi.mock('@/lib/groq/planner-agent', () => ({
  runPlannerAgent: vi.fn(),
}));

vi.mock('@/lib/groq/assistant', () => ({
  chatWithAssistant: vi.fn(),
}));

vi.mock('@/lib/assistant-context', () => ({
  buildAssistantContext: vi.fn(),
}));

vi.mock('@/lib/ai/vision-image', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/vision-image')>();
  return {
    ...actual,
    readImageForPlanner: vi.fn(),
  };
});

import { POST } from '@/app/api/assistant/planner/route';
import { requireUser } from '@/lib/api/auth-helpers';
import { loadExtractContext } from '@/lib/groq/extract-context';
import { runPlannerAgent } from '@/lib/groq/planner-agent';
import { PlannerVisionError, readImageForPlanner } from '@/lib/ai/vision-image';

const authedUser = {
  uid: 'user-1',
  role: 'admin' as const,
  businessId: 'biz-1',
  email: 'admin@example.com',
  data: {
    id: 'user-1',
    role: 'admin',
    businessId: 'biz-1',
    name: 'Admin',
    email: 'admin@example.com',
    teamIds: [],
    memberships: [{ businessId: 'biz-1', businessName: 'TecnoFusion' }],
    preferences: {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/assistant/planner', {
    method: 'POST',
    headers: { Authorization: 'Bearer token' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue(authedUser as never);
  vi.mocked(loadExtractContext).mockResolvedValue({} as never);
  vi.mocked(runPlannerAgent).mockResolvedValue({ type: 'message', content: 'ok' });
  vi.mocked(readImageForPlanner).mockResolvedValue({
    visionText: 'Final de Base de Datos - 28/07 19:00 - Aula 3',
    summary: 'Final de Base de Datos',
  });
});

describe('POST /api/assistant/planner image payload', () => {
  it('rejects unsupported image mime types', async () => {
    const res = await POST(makeRequest({
      message: 'agenda esto',
      image: { mimeType: 'image/bmp', base64: 'aGVsbG8=' },
    }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: 'unsupported_image_type' });
    expect(readImageForPlanner).not.toHaveBeenCalled();
  });

  it('rejects images over the planner limit', async () => {
    const tooLarge = Buffer.alloc(PLANNER_IMAGE_MAX_BYTES + 1).toString('base64');

    const res = await POST(makeRequest({
      message: 'agenda esto',
      image: { mimeType: 'image/png', base64: tooLarge },
    }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: 'image_too_large' });
    expect(readImageForPlanner).not.toHaveBeenCalled();
  });

  it('asks Eventos vs Tareas on image-only before calling vision', async () => {
    const res = await POST(makeRequest({
      message: '',
      image: { mimeType: 'image/png', base64: 'aGVsbG8=' },
    }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      type: 'clarify',
      field: 'kind',
      options: ['Eventos', 'Tareas'],
    });
    expect(readImageForPlanner).not.toHaveBeenCalled();
    expect(runPlannerAgent).not.toHaveBeenCalled();
  });

  it('merges user text with vision text before planner execution', async () => {
    await POST(makeRequest({
      message: 'crea eventos',
      image: { mimeType: 'image/jpeg', base64: 'aGVsbG8=' },
      messages: [{ role: 'assistant', content: 'Dale' }],
    }));

    expect(runPlannerAgent).toHaveBeenCalledWith(
      expect.stringContaining('crea eventos'),
      expect.anything(),
      [{ role: 'assistant', content: 'Dale' }],
    );
    expect(vi.mocked(runPlannerAgent).mock.calls[0][0]).toContain('[Contenido de la imagen]');
  });

  it('returns a friendly message when Gemini key is missing', async () => {
    vi.mocked(readImageForPlanner).mockRejectedValueOnce(
      new PlannerVisionError('missing_google_ai_key', 'missing key'),
    );

    const res = await POST(makeRequest({
      message: 'creá eventos',
      image: { mimeType: 'image/webp', base64: 'aGVsbG8=' },
    }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      type: 'message',
      content: expect.stringContaining('GOOGLE_AI_API_KEY'),
    });
    expect(runPlannerAgent).not.toHaveBeenCalled();
  });
});
