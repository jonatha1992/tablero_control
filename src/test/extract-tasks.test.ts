import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  defaultSpaceName,
  displaySpaceName,
  LABELS,
  resolveSpaceLabels,
} from '@/lib/terminology';
import type { BusinessSettings } from '@/types/domain/business';
import type { ExtractContext } from '@/lib/groq/extract-context';

vi.mock('@/lib/groq/client', () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

import { groq } from '@/lib/groq/client';
import { extractTasksFromTranscription } from '@/lib/groq/extract-tasks';
import { GROQ_TEXT_MODEL } from '@/lib/ai/models';

const mockCreate = groq.chat.completions.create as ReturnType<typeof vi.fn>;

const baseCtx: ExtractContext = {
  members: [{ id: 'u1', name: 'Ana' }],
  locations: [{ id: 'loc1', name: 'Oficina' }],
  projects: [{ id: 'p1', name: 'Principal' }],
  cycles: [{ id: 'cyc1', name: 'Sprint 1' }],
  objectives: [{ id: 'obj1', name: 'Meta Q2' }],
  defaultProjectId: 'p1',
  siteLabel: 'Sede',
  today: '2026-05-30',
};

function mockGroqResponse(tasks: unknown[]) {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify({ tasks }) } }],
  });
}

describe('sanitizeTask (via extractTasksFromTranscription)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filtra assigneeIds que no existen en el contexto', async () => {
    mockGroqResponse([
      {
        title: 'Tarea test',
        priority: 'medium',
        status: 'todo',
        type: 'task',
        assigneeIds: ['u1', 'u-invalid'],
        tags: [],
        order: 1,
      },
    ]);
    const tasks = await extractTasksFromTranscription('texto', baseCtx);
    expect(tasks[0].assigneeIds).toEqual(['u1']);
  });

  it('conserva projectIds válidos múltiples', async () => {
    mockGroqResponse([
      {
        title: 'Tarea multi',
        priority: 'medium',
        status: 'todo',
        type: 'task',
        assigneeIds: [],
        tags: [],
        order: 1,
        projectIds: ['p1', 'p2'],
      },
    ]);
    const ctx = {
      ...baseCtx,
      projects: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
    };
    const tasks = await extractTasksFromTranscription('texto', ctx);
    expect(tasks[0].projectIds).toEqual(['p1', 'p2']);
    expect(tasks[0].projectId).toBeUndefined();
  });

  it('filtra projectIds inválidos y mantiene los válidos', async () => {
    mockGroqResponse([
      {
        title: 'Tarea',
        priority: 'low',
        status: 'todo',
        type: 'task',
        assigneeIds: [],
        tags: [],
        order: 1,
        projectIds: ['p1', 'p-bad'],
      },
    ]);
    const tasks = await extractTasksFromTranscription('texto', baseCtx);
    expect(tasks[0].projectIds).toEqual(['p1']);
    expect(tasks[0].projectId).toBe('p1');
  });

  it('reemplaza projectId inválido con defaultProjectId', async () => {
    mockGroqResponse([
      {
        title: 'Tarea',
        priority: 'low',
        status: 'todo',
        type: 'task',
        assigneeIds: [],
        tags: [],
        order: 1,
        projectId: 'p-no-existe',
      },
    ]);
    const tasks = await extractTasksFromTranscription('texto', baseCtx);
    expect(tasks[0].projectId).toBe('p1');
  });

  it('elimina locationId inválido', async () => {
    mockGroqResponse([
      {
        title: 'Tarea',
        priority: 'low',
        status: 'todo',
        type: 'task',
        assigneeIds: [],
        tags: [],
        order: 1,
        locationId: 'loc-fake',
      },
    ]);
    const tasks = await extractTasksFromTranscription('texto', baseCtx);
    expect(tasks[0].locationId).toBeUndefined();
  });

  it('mantiene locationId válido', async () => {
    mockGroqResponse([
      {
        title: 'Tarea',
        priority: 'low',
        status: 'todo',
        type: 'task',
        assigneeIds: [],
        tags: [],
        order: 1,
        locationId: 'loc1',
      },
    ]);
    const tasks = await extractTasksFromTranscription('texto', baseCtx);
    expect(tasks[0].locationId).toBe('loc1');
  });

  it('corrige status inválido a todo', async () => {
    mockGroqResponse([
      {
        title: 'Tarea',
        priority: 'high',
        status: 'invalid_status',
        type: 'task',
        assigneeIds: [],
        tags: [],
        order: 1,
      },
    ]);
    const tasks = await extractTasksFromTranscription('texto', baseCtx);
    expect(tasks[0].status).toBe('todo');
  });

  it('recorta título a 120 caracteres', async () => {
    const longTitle = 'A'.repeat(200);
    mockGroqResponse([
      {
        title: longTitle,
        priority: 'medium',
        status: 'todo',
        type: 'task',
        assigneeIds: [],
        tags: [],
        order: 1,
      },
    ]);
    const tasks = await extractTasksFromTranscription('texto', baseCtx);
    expect(tasks[0].title.length).toBe(120);
  });

  it('normaliza checklist con ids faltantes', async () => {
    mockGroqResponse([
      {
        title: 'Con checklist',
        priority: 'medium',
        status: 'todo',
        type: 'task',
        assigneeIds: [],
        tags: [],
        order: 1,
        checklist: [{ text: 'Paso 1' }, { id: 'c2', text: 'Paso 2', done: true }],
      },
    ]);
    const tasks = await extractTasksFromTranscription('texto', baseCtx);
    expect(tasks[0].checklist?.[0].id).toBe('c1');
    expect(tasks[0].checklist?.[1].id).toBe('c2');
    expect(tasks[0].checklist?.[1].done).toBe(true);
  });

  it('devuelve array vacío cuando tasks no es array', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '{"tasks": null}' } }],
    });
    const tasks = await extractTasksFromTranscription('texto', baseCtx);
    expect(tasks).toEqual([]);
  });
});

describe('extract-tasks sanitize via resolveSpaceLabels', () => {
  it('resolveSpaceLabels respeta preset departamento', () => {
    const settings: BusinessSettings = {
      terminology: { locationPreset: 'departamento' },
    };
    expect(resolveSpaceLabels(settings).sites).toBe('Departamentos');
  });
});

describe('ExtractContext shape', () => {
  it('acepta contexto mínimo para extracción', () => {
    const ctx: ExtractContext = {
      members: [{ id: 'u1', name: 'Ana' }],
      locations: [],
      projects: [{ id: 'p1', name: 'Principal' }],
      cycles: [],
      objectives: [],
      defaultProjectId: 'p1',
      siteLabel: 'Sede',
      today: '2026-05-30',
    };
    expect(ctx.defaultProjectId).toBe('p1');
  });
});

describe('fallback cuando el modelo no devuelve tareas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea una tarea desde una intencion vaga', async () => {
    mockGroqResponse([]);
    const tasks = await extractTasksFromTranscription(
      'necesito hacer el tema de mapa del delito',
      baseCtx,
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Hacer el tema de mapa del delito');
    expect(tasks[0].status).toBe('todo');
    expect(tasks[0].projectId).toBe('p1');
  });

  it('reconoce "hay que" y recorta el prefijo', async () => {
    mockGroqResponse([]);
    const tasks = await extractTasksFromTranscription('hay que pintar el deposito', baseCtx);
    expect(tasks[0].title).toBe('Pintar el deposito');
  });

  it('no crea tareas en texto conversacional', async () => {
    mockGroqResponse([]);
    const tasks = await extractTasksFromTranscription('hola, como va todo?', baseCtx);
    expect(tasks).toEqual([]);
  });

  it('descarta tareas del modelo con title vacio y cae al fallback', async () => {
    mockGroqResponse([{ title: '  ', priority: 'medium', status: 'todo', type: 'task', assigneeIds: [], tags: [], order: 1 }]);
    const tasks = await extractTasksFromTranscription('tengo que cerrar la caja', baseCtx);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Cerrar la caja');
  });
});

describe('modelo de Groq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // GroqCloud dio de baja llama-3.3-70b-versatile y la API empezo a devolver 404.
  // El catch de la route lo mostraba como "No detecte tareas en el texto", asi que
  // el corte de servicio parecia un problema de comprension. El modelo va por una
  // sola constante para que no vuelva a quedar hardcodeado en cada archivo.
  it('usa la constante compartida y no un modelo hardcodeado', async () => {
    mockGroqResponse([]);
    await extractTasksFromTranscription('hola', baseCtx);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: GROQ_TEXT_MODEL }),
    );
  });

  it('el modelo por defecto no es uno dado de baja', () => {
    expect(GROQ_TEXT_MODEL).not.toMatch(/llama-3\.[123]/);
    expect(GROQ_TEXT_MODEL.length).toBeGreaterThan(0);
  });
});

describe('terminology', () => {
  it('defaultSpaceName usa Espacio de', () => {
    expect(defaultSpaceName('Ana')).toBe('Espacio de Ana');
  });

  it('displaySpaceName normaliza nombres legacy', () => {
    expect(displaySpaceName('Negocio de David')).toBe('Espacio de David');
    expect(displaySpaceName('')).toBe(LABELS.mySpace);
  });
});
