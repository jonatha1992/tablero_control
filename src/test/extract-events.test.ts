import { describe, it, expect, vi } from 'vitest';

const { createCompletion } = vi.hoisted(() => ({
  createCompletion: vi.fn(),
}));

vi.mock('@/lib/groq/client', () => ({
  groq: {
    chat: {
      completions: {
        create: createCompletion.mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                events: [{
                  title: 'Examen final',
                  startDate: '2026-07-25',
                  startTime: null,
                  endDate: null,
                  endTime: null,
                  allDay: true,
                  assigneeIds: [],
                  order: 1,
                }],
              }),
            },
          }],
        }),
      },
    },
  },
}));

import { extractEventsFromText } from '@/lib/groq/extract-events';

describe('extractEventsFromText', () => {
  it('parsea un evento all-day', async () => {
    createCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            events: [{
              title: 'Examen final',
              startDate: '2026-07-25',
              startTime: null,
              endDate: null,
              endTime: null,
              allDay: true,
              assigneeIds: [],
              order: 1,
            }],
          }),
        },
      }],
    });

    const events = await extractEventsFromText('Examen final el 25 de julio', {
      members: [],
      locations: [],
      projects: [],
      cycles: [],
      objectives: [],
      today: '2026-07-19',
      siteLabel: 'Sede',
    });
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Examen final');
    expect(events[0].allDay).toBe(true);
    expect(events[0].startDate).toBe('2026-07-25');
  });

  it('fuerza allDay false cuando hay hora', async () => {
    createCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            events: [{
              title: 'Reunion semanal',
              startDate: '2026-07-25',
              startTime: '09:30',
              endDate: '2026-07-25',
              endTime: '10:30',
              allDay: true,
              assigneeIds: [],
              order: 1,
            }],
          }),
        },
      }],
    });

    const events = await extractEventsFromText('Reunion semanal el 25 de julio a las 09:30', {
      members: [],
      locations: [],
      projects: [],
      cycles: [],
      objectives: [],
      today: '2026-07-19',
      siteLabel: 'Sede',
    });

    expect(events).toHaveLength(1);
    expect(events[0].allDay).toBe(false);
    expect(events[0].startTime).toBe('09:30');
    expect(events[0].endTime).toBe('10:30');
  });

  const ctx = {
    members: [],
    locations: [],
    projects: [],
    cycles: [],
    objectives: [],
    today: '2026-07-19',
    siteLabel: 'Sede',
  };

  it('no descarta el evento cuando el modelo no devuelve fecha: cae a hoy', async () => {
    createCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            events: [{ title: 'Ir a la sede centro', startDate: null, allDay: true, assigneeIds: [], order: 1 }],
          }),
        },
      }],
    });

    const events = await extractEventsFromText('hay que ir a la sede centro', ctx);
    expect(events).toHaveLength(1);
    expect(events[0].startDate).toBe('2026-07-19');
    expect(events[0].allDay).toBe(true);
  });

  it('fallback: crea evento cuando el modelo devuelve vacio y el texto pide ir a un lugar', async () => {
    createCompletion.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ events: [] }) } }],
    });

    const events = await extractEventsFromText('hay que ir a la sede centro', ctx);
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Ir a la sede centro');
    expect(events[0].startDate).toBe('2026-07-19');
  });

  it('fallback: no inventa evento si el texto es una tarea', async () => {
    createCompletion.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ events: [] }) } }],
    });

    const events = await extractEventsFromText('necesito hacer el tema de mapa del delito', ctx);
    expect(events).toEqual([]);
  });

  it('fallback: no inventa evento en texto conversacional', async () => {
    createCompletion.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ events: [] }) } }],
    });

    const events = await extractEventsFromText('hola, como va?', ctx);
    expect(events).toEqual([]);
  });
});
