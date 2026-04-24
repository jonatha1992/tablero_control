import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location.service';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const location = await locationService.getById(id);
  if (!location) {
    return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 });
  }
  return NextResponse.json(location);
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await locationService.update(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await locationService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
