export interface CorreoButton {
  texto: string;
  url: string;
}

export type CorreoTemplate =
  | {
      id: 'aviso';
      data: {
        titulo: string;
        mensaje: string;
        boton?: CorreoButton;
      };
    }
  | {
      id: 'bienvenida';
      data: {
        nombre: string;
        mensaje?: string;
        boton?: CorreoButton;
      };
    }
  | {
      id: 'codigo';
      data: {
        codigo: string;
        vencimiento: string;
        titulo?: string;
        mensaje?: string;
      };
    }
  | {
      id: 'pago-recibido';
      data: {
        monto: string | number;
        moneda: string;
        pagador: string;
        fecha: string;
        sucursal?: string;
      };
    };

export interface CorreoCentralPayload {
  to: string;
  subject: string;
  template: CorreoTemplate;
  replyTo?: string;
  idempotencyKey?: string;
}

export interface CorreoCentralResponse {
  id: string;
  from: string;
  status: 'sent' | 'queued';
  replayed: boolean;
}

export interface CorreoCentralOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE_URL = 'https://correo.tecnofusion.dev';
const DEFAULT_TIMEOUT_MS = 10_000;

export async function sendCorreoCentral(
  payload: CorreoCentralPayload,
  options: CorreoCentralOptions = {},
): Promise<CorreoCentralResponse> {
  const apiKey = (options.apiKey ?? process.env.CORREO_API_KEY ?? '').trim();
  if (!apiKey) {
    throw new Error('CORREO_API_KEY no está configurada');
  }

  const baseUrl = (options.baseUrl ?? process.env.CORREO_CENTRAL_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(`${baseUrl}/v1/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await res.text();
    let parsed: Record<string, unknown> | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        parsed = null;
      }
    }

    if (!res.ok) {
      const code = typeof parsed?.code === 'string' ? ` (${parsed.code})` : '';
      const detail = typeof parsed?.error === 'string' ? parsed.error : raw || res.statusText;
      throw new Error(`correo-central HTTP ${res.status}${code}: ${detail}`);
    }

    return (parsed ?? { id: '', from: '', status: 'sent', replayed: false }) as unknown as CorreoCentralResponse;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`correo-central timeout tras ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
