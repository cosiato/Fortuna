import { NextRequest, NextResponse } from 'next/server';
import { getEntityById, updateEntity, deleteEntity } from '@/lib/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const entityId = parseInt(id, 10);

    if (isNaN(entityId)) {
      return NextResponse.json(
        { error: 'Invalid entity ID' },
        { status: 400 }
      );
    }

    const entity = await getEntityById(entityId);

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error fetching entity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entity' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const entityId = parseInt(id, 10);

    if (isNaN(entityId)) {
      return NextResponse.json(
        { error: 'Invalid entity ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, type } = body;

    if (entityId === 0 && type && type !== 'individual') {
      return NextResponse.json(
        { error: 'Cannot change type of individual entity' },
        { status: 400 }
      );
    }

    const updates: { name?: string; type?: 'individual' | 'company' } = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }
    if (type !== undefined) {
      if (type !== 'individual' && type !== 'company') {
        return NextResponse.json(
          { error: 'Type must be "individual" or "company"' },
          { status: 400 }
        );
      }
      updates.type = type;
    }

    const entity = await updateEntity(entityId, updates);

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error updating entity:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update entity', details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const entityId = parseInt(id, 10);

    if (isNaN(entityId)) {
      return NextResponse.json(
        { error: 'Invalid entity ID' },
        { status: 400 }
      );
    }

    if (entityId === 0) {
      return NextResponse.json(
        { error: 'Cannot delete individual entity' },
        { status: 400 }
      );
    }

    const deleted = await deleteEntity(entityId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entity:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete entity', details: message },
      { status: 500 }
    );
  }
}
