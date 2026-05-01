import { NextResponse } from 'next/server';

export function handle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error('[api-error]', err);
      return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
    }
  };
}
