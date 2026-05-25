import { NextResponse } from 'next/server';

export const POST = () =>
  NextResponse.json({ error: 'deprecated', detail: 'Use /api/mercadopago/checkout' }, { status: 410 });
