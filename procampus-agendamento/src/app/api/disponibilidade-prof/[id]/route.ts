import { NextRequest, NextResponse } from 'next/server';

// DELETE: remover disponibilidade do professor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    message: `DELETE disponibilidade-prof ${params.id}`,
  });
}
