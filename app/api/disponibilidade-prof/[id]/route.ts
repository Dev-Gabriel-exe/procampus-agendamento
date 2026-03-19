// app/api/disponibilidade-prof/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    // Verifica se tem agendamentos futuros
    const futureAppts = await prisma.appointment.findFirst({
      where: {
        availabilityId: params.id,
        status: 'confirmed',
        date: { gte: new Date() },
      },
    })

    if (futureAppts) {
      return NextResponse.json(
        { error: 'Não é possível remover: há reuniões futuras agendadas neste horário.' },
        { status: 409 }
      )
    }

    // Desativa em vez de deletar (preserva histórico)
    await prisma.availability.update({
      where: { id: params.id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao remover disponibilidade' }, { status: 500 })
  }
}
