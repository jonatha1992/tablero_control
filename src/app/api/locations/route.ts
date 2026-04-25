import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location.service';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

  const status = searchParams.get('status');
  const locations = status === 'active'
    ? await locationService.getActiveLocations(businessId)
    : await locationService.getByBusiness(businessId);

  return NextResponse.json(locations);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API Locations] POST body:', body);
    if (!body.businessId || !body.name) {
      console.warn('[API Locations] Missing businessId or name:', { businessId: body.businessId, name: body.name });
      return NextResponse.json({ error: 'businessId y name son requeridos' }, { status: 400 });
    }

    const location = await locationService.create({
      businessId: body.businessId,
      name: body.name,
      type: body.type || 'department',
      description: body.description,
      address: body.address,
      status: body.status || 'active',
      teamIds: [],
      taskIds: [],
      metadata: body.metadata || {},
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
