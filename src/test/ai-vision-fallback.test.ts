import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * La lectura de imagen del planner tiene UN solo fallback posible.
 *
 * GroqCloud no sirve ningún modelo con entrada de imagen (verificado el
 * 2026-08-06 contra /v1/models), así que cuando Gemini se queda sin cuota el
 * único que puede leer la imagen es NVIDIA. Si esa cadena se rompe, la feature
 * no degrada: desaparece. De ahí que valga cubrirla.
 */

const generateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent };
    }
  },
}));

import { readImageForPlanner, PlannerVisionError } from '@/lib/ai/vision-image';
import { resetAiPools } from '@/lib/ai/pools';

const IMAGE = { mimeType: 'image/png', base64: 'aGVsbG8=' } as const;

function geminiReturns(text: string) {
  generateContent.mockResolvedValue({ response: { text: () => text } });
}

/** Error con `status`, que es lo que el pool mira para decidir si rota. */
function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function nvidiaReplies(content: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  });
}

describe('readImageForPlanner: cadena Gemini -> NVIDIA', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY1 = 'gemini-key-1';
    process.env.NVIDIA_API_KEY = 'nvidia-key';
    resetAiPools();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY1;
    delete process.env.NVIDIA_API_KEY;
    resetAiPools();
  });

  it('usa Gemini y no toca NVIDIA cuando Gemini responde', async () => {
    geminiReturns('Reunion 12 de marzo\nsala 3');
    const fetchMock = nvidiaReplies('no deberia usarse');
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await readImageForPlanner(IMAGE);

    expect(result.visionText).toContain('Reunion 12 de marzo');
    expect(result.summary).toBe('Reunion 12 de marzo');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cae a NVIDIA cuando Gemini agota la cuota', async () => {
    generateContent.mockRejectedValue(httpError(429, 'quota exceeded'));
    const fetchMock = nvidiaReplies('Examen 20 de marzo');
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await readImageForPlanner(IMAGE);

    expect(result.visionText).toBe('Examen 20 de marzo');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // La imagen tiene que viajar como data URI, que es el formato que espera
    // la API OpenAI-compatible de NVIDIA.
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    const parts = body.messages[0].content;
    expect(parts[1].image_url.url).toBe(`data:${IMAGE.mimeType};base64,${IMAGE.base64}`);
  });

  it('cae a NVIDIA cuando Gemini devuelve texto vacío', async () => {
    geminiReturns('   ');
    const fetchMock = nvidiaReplies('Agenda leida por NVIDIA');
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await readImageForPlanner(IMAGE);

    expect(result.visionText).toBe('Agenda leida por NVIDIA');
  });

  it('falla con vision_read_failed si los dos proveedores fallan', async () => {
    generateContent.mockRejectedValue(httpError(429, 'quota exceeded'));
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'service unavailable',
    }) as unknown as typeof fetch;

    await expect(readImageForPlanner(IMAGE)).rejects.toMatchObject({
      code: 'vision_read_failed',
    });
  });

  it('sin ninguna key pide configurar, no dice que la lectura falló', async () => {
    delete process.env.GEMINI_API_KEY1;
    delete process.env.NVIDIA_API_KEY;
    resetAiPools();

    await expect(readImageForPlanner(IMAGE)).rejects.toMatchObject({
      code: 'missing_google_ai_key',
    });
  });

  it('usa NVIDIA solo cuando Gemini no tiene ninguna key', async () => {
    delete process.env.GEMINI_API_KEY1;
    resetAiPools();
    const fetchMock = nvidiaReplies('Solo NVIDIA');
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await readImageForPlanner(IMAGE);

    expect(result.visionText).toBe('Solo NVIDIA');
    expect(generateContent).not.toHaveBeenCalled();
  });
});

describe('PlannerVisionError', () => {
  it('conserva el code para que la route elija el mensaje', () => {
    const err = new PlannerVisionError('vision_read_failed', 'boom');
    expect(err.code).toBe('vision_read_failed');
    expect(err.name).toBe('PlannerVisionError');
  });
});
