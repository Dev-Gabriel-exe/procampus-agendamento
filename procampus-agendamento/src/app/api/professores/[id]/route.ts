import { NextRequest, NextResponse } from 'next/server';

// PUT: editar professor
// DELETE: deletar professor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: `PUT professor ${params.id}` });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: `DELETE professor ${params.id}` });
}
