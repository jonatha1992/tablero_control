import { NextResponse } from 'next/server';
import { getAllEffectivePlanConfigs } from '@/lib/mercadopago/plan-config';
import { handle } from '@/lib/api/route-handler';

export const GET = handle(async () => {
  const plans = await getAllEffectivePlanConfigs();
  return NextResponse.json({ plans });
});
