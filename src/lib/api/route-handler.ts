import { NextResponse } from 'next/server';
import { TenantMismatchError } from '@/lib/permissions/tenant-guard';

export function handle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof TenantMismatchError) {
        return NextResponse.json({ error: 'forbidden', reason: 'tenant_mismatch' }, { status: 403 });
      }
      console.error('[api-error]', err);
      return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
    }
  };
}
