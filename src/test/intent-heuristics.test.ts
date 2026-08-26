import { describe, it, expect } from 'vitest';
import {
  buildActionTitle,
  classifyActionKind,
  hasActionIntent,
} from '@/lib/groq/intent-heuristics';
import { resolveIntent, type PlannerIntentResult } from '@/lib/groq/planner-intent';

describe('hasActionIntent', () => {
  const actionable = [
    'necesito hacer el tema de mapa del delito',
    'tengo que hacer el informe',
    'hay que ir a la sede centro',
    'alguien tiene que aceptar el presupuesto',
    'me falta cargar las facturas',
    'habria que revisar el stock',
    'acordate de llamar al contador',
  ];
  it.each(actionable)('detecta accion en %s', (text) => {
    expect(hasActionIntent(text)).toBe(true);
  });

  const conversational = ['hola, como va todo?', 'gracias!', 'buenisimo', ''];
  it.each(conversational)('no detecta accion en %s', (text) => {
    expect(hasActionIntent(text)).toBe(false);
  });
});

describe('classifyActionKind', () => {
  const events = [
    'hay que ir a la sede centro',
    'tengo que pasar por el deposito',
    'necesito reunirme con Ana',
    'tengo que ir al parcial de metodologias',
    'hay que asistir a la capacitacion',
  ];
  it.each(events)('clasifica como evento: %s', (text) => {
    expect(classifyActionKind(text)).toBe('event');
  });

  const tasks = [
    'necesito hacer el tema de mapa del delito',
    'tengo que armar el informe mensual',
    'hay que mandar la factura',
    'me falta actualizar el stock',
  ];
  it.each(tasks)('clasifica como tarea: %s', (text) => {
    expect(classifyActionKind(text)).toBe('task');
  });

  it('ante duda genuina cae a tarea', () => {
    expect(classifyActionKind('necesito el tema ese')).toBe('task');
  });
});

describe('buildActionTitle', () => {
  it.each([
    ['necesito hacer el tema de mapa del delito', 'Hacer el tema de mapa del delito'],
    ['hay que ir a la sede centro', 'Ir a la sede centro'],
    ['tengo que mandar la factura', 'Mandar la factura'],
    ['alguien tiene que aceptar el presupuesto', 'Aceptar el presupuesto'],
  ])('%s -> %s', (input, expected) => {
    expect(buildActionTitle(input)).toBe(expected);
  });

  it('corta en la primera oracion y respeta el limite de 120', () => {
    expect(buildActionTitle('tengo que cerrar caja. Despues aviso.')).toBe('Cerrar caja');
    expect(buildActionTitle('necesito ' + 'a'.repeat(300)).length).toBe(120);
  });
});

function intent(partial: Partial<PlannerIntentResult>): PlannerIntentResult {
  return {
    intent: 'unknown',
    confidence: 0.5,
    missingSlots: [],
    ...partial,
  };
}

describe('resolveIntent', () => {
  it('nunca pregunta si es tarea o evento: resuelve tarea', () => {
    const out = resolveIntent(
      intent({
        intent: 'unknown',
        missingSlots: ['kind'],
        clarificationQuestion: 'Es un Evento o una Tarea?',
        suggestedOptions: ['Evento', 'Tarea'],
      }),
      'necesito hacer el tema de mapa del delito',
    );
    expect(out.intent).toBe('create_task');
    expect(out.clarificationQuestion).toBeUndefined();
    expect(out.missingSlots).toEqual([]);
  });

  it('nunca pregunta si es tarea o evento: resuelve evento', () => {
    const out = resolveIntent(
      intent({ intent: 'unknown', missingSlots: ['kind'], clarificationQuestion: 'Evento o Tarea?' }),
      'hay que ir a la sede centro',
    );
    expect(out.intent).toBe('create_event');
    expect(out.clarificationQuestion).toBeUndefined();
  });

  it('un pedido mal leido como query se corrige a tarea', () => {
    const out = resolveIntent(
      intent({ intent: 'query', confidence: 0.9 }),
      'tengo que armar el informe mensual',
    );
    expect(out.intent).toBe('create_task');
  });

  it('no frena por falta de fecha, responsable o tablero', () => {
    const out = resolveIntent(
      intent({
        intent: 'create_task',
        confidence: 0.8,
        missingSlots: ['dueDate', 'assignee', 'project'],
        clarificationQuestion: 'Para cuando?',
      }),
      'hay que pintar el deposito',
    );
    expect(out.intent).toBe('create_task');
    expect(out.missingSlots).toEqual([]);
    expect(out.clarificationQuestion).toBeUndefined();
  });

  it('mantiene el clarify cuando no hay ninguna accion', () => {
    const out = resolveIntent(
      intent({
        intent: 'unknown',
        missingSlots: ['goal'],
        clarificationQuestion: 'Que queres organizar?',
      }),
      'organizame',
    );
    expect(out.intent).toBe('unknown');
    expect(out.clarificationQuestion).toBe('Que queres organizar?');
    expect(out.missingSlots).toEqual(['goal']);
  });

  it('respeta una consulta real', () => {
    const out = resolveIntent(
      intent({ intent: 'query', confidence: 0.9 }),
      'cuantas tareas tengo pendientes?',
    );
    expect(out.intent).toBe('query');
  });

  it('no toca create_plan', () => {
    const out = resolveIntent(
      intent({ intent: 'create_plan', confidence: 0.9, planType: 'cycle' }),
      'necesito armar un sprint de dos semanas',
    );
    expect(out.intent).toBe('create_plan');
  });
});
