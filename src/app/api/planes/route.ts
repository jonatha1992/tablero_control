import { NextResponse } from 'next/server';
import { getAllEffectivePlanConfigs } from '@/lib/mercadopago/plan-config';

export async function GET() {
  const plans = await getAllEffectivePlanConfigs();
  return NextResponse.json({ plans });
}
