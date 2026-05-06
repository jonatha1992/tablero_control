'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  useEffect(() => {
    const target = status ? `/dashboard/config?tab=facturacion&status=${status}` : '/dashboard/config?tab=facturacion';
    router.replace(target);
  }, [router, status]);

  return null;
}
