import { NextRequest, NextResponse } from 'next/server';

// PATCH: cancelar agendamento
// DELETE: deletar agendamento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: `PATCH agendamento ${params.id}` });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: `DELETE agendamento ${params.id}` });
}
