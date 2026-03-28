// app/api/segunda-chamada/comprovantes/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any)?.role ?? 'geral'

  try {
    // Filtra por séries do role
    const gradeFilter = !isGeral(role) ? getGradesForRole(role) : null

    const bookings = await prisma.examBooking.findMany({
      where: {
        // Só retorna quem tem alguma justificativa ou arquivo
        OR: [
          { fileUrl:  { not: null } },
          { reason:   { not: null } },
          { lutoText: { not: null } },
        ],
        // Filtra pela série do role se não for geral
        ...(gradeFilter ? {
          examSchedule: { grade: { in: gradeFilter } },
        } : {}),
      },
      include: {
        examSchedule: {
          select: { subjectName: true, grade: true, date: true, startTime: true, endTime: true },
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