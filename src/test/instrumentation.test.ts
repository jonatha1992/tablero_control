import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { register } from '../instrumentation';

const { schedule, query, count } = vi.hoisted(() => ({
  schedule: vi.fn(),
  query: vi.fn().mockResolvedValue([{ value: 1 }]),
  count: vi.fn().mockResolvedValue(0),
}));

vi.mock('node-cron', () => ({ default: { schedule } }));
vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: query, user: { count } } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_RUNTIME', 'nodejs');
  vi.stubEnv('CRON_SECRET', 'test-cron');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('scheduler interno', () => {
  it('mantiene la conexión de base pero no programa crons con INTERNAL_CRON=off', async () => {
    vi.stubEnv('INTERNAL_CRON', 'off');
    await register();
    expect(query).toHaveBeenCalledOnce();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('mantiene el scheduler habilitado por defecto', async () => {
    vi.stubEnv('INTERNAL_CRON', undefined);
    await register();
    expect(schedule).toHaveBeenCalledTimes(4);
  });

  it('no programa crons sin secreto', async () => {
    vi.stubEnv('CRON_SECRET', '');
    await register();
    expect(schedule).not.toHaveBeenCalled();
  });
});
