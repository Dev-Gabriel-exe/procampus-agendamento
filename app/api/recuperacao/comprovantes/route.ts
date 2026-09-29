// app/api/recuperacao/comprovantes/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

/** Lista os comprovantes de recuperação para a aba da secretaria. */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any)?.role ?? 'geral'
  const gradeFilter = !isGeral(role) ? getGradesForRole(role) : null

  try {
    const bookings = await prisma.recoveryBooking.findMany({
      where: {
        // Só entra aqui quem anexou um arquivo para a secretaria analisar.
        fileUrl: { not: null },
        ...(gradeFilter ? {
          recoverySchedule: { grade: { in: gradeFilter } },
        } : {}),
      },
      include: {
        recoverySchedule: {
          select: {
            subjectName: true,
            grade: true,
            date: true,
            startTime: true,
            endTime: true,
            type: true,
            isFree: true,
            priceCents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Erro ao buscar comprovantes de recuperação:', error)
    return NextResponse.json({ error: 'Erro ao buscar comprovantes' }, { status: 500 })
  }
}
