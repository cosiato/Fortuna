import { NextRequest, NextResponse } from 'next/server';
import { getAllEntities, createEntity, ensureIndividualEntity, EntityType } from '@/lib/db';

export async function GET() {
  try {
    await ensureIndividualEntity();
    const entities = await getAllEntities();
    return NextResponse.json(entities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const entity = await createEntity({
      name: name.trim(),
      type: 'company' as EntityType,
    });

    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create entity', details: message },
      { status: 500 }
    );
  }
}
