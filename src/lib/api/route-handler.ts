import { NextResponse } from 'next/server';
import { TenantMismatchError } from '@/lib/permissions/tenant-guard';

export function handle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args) => {
    try {
      const response = await fn(...args);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return response;
    } catch (err) {
      if (err instanceof TenantMismatchError) {
        const response = NextResponse.json({ error: 'forbidden', reason: 'tenant_mismatch' }, { status: 403 });
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return response;
      }
      console.error('[api-error]', err);
      const response = NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return response;
    }
  };
}
