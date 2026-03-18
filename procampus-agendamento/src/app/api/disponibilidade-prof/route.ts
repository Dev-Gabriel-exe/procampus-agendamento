import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET — lista todas as disponibilidades (para a secretaria)
export async function GET() {
  try {
    const availabilities = await prisma.availability.findMany({
      where: { active: true },
      include: {
        teacher: true,
        appointments: {
          where: { status: 'confirmed' },
          select: { id: true, date: true, startTime: true },
        },
      },
      orderBy: [{ teacher: { name: 'asc' } }, { dayOfWeek: 'asc' }],
    })
    return NextResponse.json(availabilities)
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar disponibilidades' }, { status: 500 })
  }
}

// POST — cria disponibilidade recorrente
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { teacherId, dayOfWeek, startTime, endTime } = await req.json()

    if (teacherId === undefined || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: 'Dia da semana inválido' }, { status: 400 })
    }

    // Verifica se já existe disponibilidade igual para este professor neste dia/horário
    const existing = await prisma.availability.findFirst({
      where: { teacherId, dayOfWeek, startTime, endTime, active: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Este professor já tem disponibilidade neste dia e horário.' },
        { status: 409 }
      )
    }

    const availability = await prisma.availability.create({
      data: { teacherId, dayOfWeek, startTime, endTime },
      include: { teacher: true },
    })

    return NextResponse.json(availability, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao criar disponibilidade' }, { status: 500 })
  }
}
