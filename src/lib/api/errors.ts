export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function parseApiErrorBody(text: string): { message: string; code?: string } {
  try {
    const body = JSON.parse(text) as { error?: string; detail?: string; message?: string };
    const code = body.error;
    const message = body.detail ?? body.message ?? code ?? text;
    return { message, code };
  } catch {
    return { message: text };
  }
}
