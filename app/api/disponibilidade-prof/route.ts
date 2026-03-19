// app/api/disponibilidade-prof/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSlots } from '@/lib/slots'

export const dynamic = 'force-dynamic'

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
      orderBy: [{ teacher: { name: 'asc' } }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
    return NextResponse.json(availabilities)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar disponibilidades' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { teacherId, dayOfWeek, startTime, endTime } = await req.json()

    if (!teacherId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: 'Dia da semana inválido' }, { status: 400 })
    }

    // ✅ Gera slots individuais de 20min
    const slots = generateSlots(startTime, endTime) // default 20min
    if (slots.length === 0) {
      return NextResponse.json({ error: 'Intervalo deve ter no mínimo 20 minutos.' }, { status: 400 })
    }

    // Verifica duplicatas para cada slot
    const created = []
    const skipped = []

    for (const slot of slots) {
      const existing = await prisma.availability.findFirst({
        where: { teacherId, dayOfWeek, startTime: slot.startTime, endTime: slot.endTime, active: true },
      })
      if (existing) {
        skipped.push(slot.startTime)
        continue
      }
      const avail = await prisma.availability.create({
        data: { teacherId, dayOfWeek, startTime: slot.startTime, endTime: slot.endTime },
        include: { teacher: true },
      })
      created.push(avail)
    }

    if (created.length === 0) {
      return NextResponse.json(
        { error: 'Todos os slots já existem para este professor neste dia.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ created, skipped }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar disponibilidade' }, { status: 500 })
  }
}