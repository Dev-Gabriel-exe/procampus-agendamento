// app/api/segunda-chamada/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ── GET — público (pais) ou autenticado (secretaria) ───────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const isPublic = searchParams.get('public') === 'true'
  const grade    = searchParams.get('grade')
  const subject  = searchParams.get('subject')

  // Rota pública: pais buscando slots disponíveis
  if (isPublic) {
    try {
      const exams = await prisma.examSchedule.findMany({
        where: {
          active: true,
          ...(grade   ? { grade }                : {}),
          ...(subject ? { subjectName: subject } : {}),
        },
        include: {
          bookings: {
            select: { id: true }, // pais só vêem contagem
          },
        },
        orderBy: { date: 'asc' },
      })
      return NextResponse.json(exams)
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: 'Erro ao buscar provas' }, { status: 500 })
    }
  }

  // Rota privada: secretaria vê tudo com bookings completos
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const exams = await prisma.examSchedule.findMany({
      include: {
        bookings: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(exams)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao buscar provas' }, { status: 500 })
  }
}

// ── POST — secretaria cria slot ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { subjectId, subjectName, grade, date, startTime, endTime } = await req.json()

    if (!subjectId || !subjectName || !grade || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const exam = await prisma.examSchedule.create({
      data: {
        subjectId,
        subjectName,
        grade,
        date:      new Date(date),
        startTime,
        endTime,
      },
    })

    return NextResponse.json(exam)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar slot' }, { status: 500 })
  }
}