/**
 * Key pool with rotation, ported from the Python repos.
 *
 * Why rotation is worth the code: Gemini rate limits are per Google Cloud
 * project and Groq's are per organization, so keys from separate accounts add
 * real quota. A single key means one 429 takes the whole feature down while
 * six other keys sit idle.
 *
 * Cooldown length depends on the error class, which matters more than it looks:
 * a flat cooldown turns a transient 503 into minutes of downtime, while a
 * too-short one keeps hammering a key whose daily quota is genuinely spent.
 *
 * State lives in module memory. On serverless each instance keeps its own view,
 * which is a real limitation but still strictly better than no rotation: a
 * cold instance just re-discovers an exhausted key on its first call.
 */

export type KeyFailureKind = 'quota' | 'auth' | 'saturation' | 'unknown';

const COOLDOWN_SECONDS: Record<KeyFailureKind, number> = {
  quota: 15 * 60,
  auth: 60 * 60,
  saturation: 5,
  unknown: 30,
};

/** Errors worth trying the next key for. Anything else is our own bug. */
export function classifyFailure(err: unknown): KeyFailureKind | null {
  const status = extractStatus(err);
  const message = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();

  if (status === 429 || message.includes('quota') || message.includes('rate limit')) return 'quota';
  if (status === 401 || status === 403 || message.includes('api key not valid')) return 'auth';
  if (status === 503 || status === 502 || message.includes('overloaded')) return 'saturation';
  if (status === 500 || message.includes('fetch failed')) return 'unknown';
  return null;
}

function extractStatus(err: unknown): number | null {
  if (typeof err !== 'object' || err === null) return null;
  const candidate = err as { status?: unknown; code?: unknown; response?: { status?: unknown } };
  for (const value of [candidate.status, candidate.code, candidate.response?.status]) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && /^\d{3}$/.test(value)) return Number(value);
  }
  const match = /\b(4\d{2}|5\d{2})\b/.exec(err instanceof Error ? err.message : '');
  return match ? Number(match[1]) : null;
}

export class KeyPool {
  private readonly cooldownUntil = new Map<string, number>();

  constructor(
    readonly label: string,
    readonly keys: string[],
  ) {}

  get available(): boolean {
    return this.keys.length > 0;
  }

  /** Keys that are not cooling down, in configured order. */
  private usableKeys(): string[] {
    const now = Date.now();
    return this.keys.filter((key) => (this.cooldownUntil.get(key) ?? 0) <= now);
  }

  penalize(key: string, kind: KeyFailureKind): void {
    this.cooldownUntil.set(key, Date.now() + COOLDOWN_SECONDS[kind] * 1000);
  }

  /**
   * Run `fn` against each usable key until one succeeds.
   *
   * If every key is cooling down, all keys are tried anyway rather than failing
   * fast: a stale cooldown must never be the reason a request gets no answer.
   *
   * `deadline` is an absolute timestamp (`Date.now()` based) that caps the whole
   * rotation. It is not optional in spirit: a chain of providers where each key
   * can time out individually adds up to a wait no user tolerates, and the app
   * looks frozen instead of degraded. Every caller should pass one.
   */
  async run<T>(
    fn: (key: string, index: number) => Promise<T>,
    options: { deadline?: number } = {},
  ): Promise<T> {
    if (!this.available) {
      throw new Error(`No hay ninguna API key configurada para ${this.label}.`);
    }

    const { deadline } = options;
    const candidates = this.usableKeys();
    const order = candidates.length > 0 ? candidates : this.keys;
    let lastError: unknown = null;

    for (let i = 0; i < order.length; i += 1) {
      if (deadline !== undefined && Date.now() >= deadline) {
        console.warn(
          `[${this.label}] presupuesto agotado tras ${i} key(s); no se intentan las restantes.`,
        );
        break;
      }
      const key = order[i];
      try {
        return await fn(key, i);
      } catch (err) {
        const kind = classifyFailure(err);
        if (kind === null) throw err;
        this.penalize(key, kind);
        lastError = err;
        console.warn(
          `[${this.label}] key ${i + 1}/${order.length} falló (${kind}); rotando a la siguiente.`,
        );
      }
    }

    throw lastError ?? new Error(`Todas las keys de ${this.label} fallaron.`);
  }
}
