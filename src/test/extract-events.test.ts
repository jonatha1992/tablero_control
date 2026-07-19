import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/groq/client', () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
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
});
