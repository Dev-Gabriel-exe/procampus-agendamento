// app/api/segunda-chamada/comprovantes/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Retorna todos os bookings que têm algum anexo ou justificativa preenchida
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const bookings = await prisma.examBooking.findMany({
      where: {
        OR: [
          { fileUrl:  { not: null } },
          { reason:   { not: null } },
          { lutoText: { not: null } },
        ],
      },
      include: {
        examSchedule: {
          select: {
            subjectName: true,
            grade:       true,
            date:        true,
            startTime:   true,
            endTime:     true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bookings)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao buscar comprovantes' }, { status: 500 })
  }
}