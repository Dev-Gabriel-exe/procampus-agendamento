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
      orderBy: [
        { teacher: { name: 'asc' } },
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
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
    const body = await req.json()
    const {
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      isSpecial    = false,
      specificDate,          // "YYYY-MM-DD" — obrigatório quando isSpecial === true
    } = body

    // ── Validações comuns ──────────────────────────────────────────────────
    if (!teacherId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // ── Validações específicas por tipo ────────────────────────────────────
    if (isSpecial) {
      // Horário especial: precisa de specificDate, não precisa de dayOfWeek
      if (!specificDate) {
        return NextResponse.json(
          { error: 'Data específica obrigatória para horário especial.' },
          { status: 400 }
        )
      }

      // Garante que a data é válida e não está no passado
      const parsedDate = new Date(`${specificDate}T12:00:00`)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (parsedDate < today) {
        return NextResponse.json(
          { error: 'A data do horário especial não pode ser no passado.' },
          { status: 400 }
        )
      }
    } else {
      // Recorrente: precisa de dayOfWeek
      if (dayOfWeek === undefined || dayOfWeek === null) {
        return NextResponse.json({ error: 'Dia da semana obrigatório para disponibilidade recorrente.' }, { status: 400 })
      }
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        return NextResponse.json({ error: 'Dia da semana inválido.' }, { status: 400 })
      }
    }

    // ── Gera slots de 20min no intervalo ──────────────────────────────────
    const slots = generateSlots(startTime, endTime)
    if (slots.length === 0) {
      return NextResponse.json(
        { error: 'O intervalo precisa ter no mínimo 20 minutos.' },
        { status: 400 }
      )
    }

    // ── Para especiais: deriva o dayOfWeek a partir da data ───────────────
    // (campo obrigatório no schema, mesmo para especiais)
    const resolvedDayOfWeek = isSpecial
      ? new Date(`${specificDate}T12:00:00`).getDay()
      : (dayOfWeek as number)

    // ── Cria os slots, pulando duplicatas ─────────────────────────────────
    const created = []
    const skipped = []

    for (const slot of slots) {
      if (isSpecial) {
        // Duplicata especial: mesmo professor, mesma data, mesmo horário
        const existing = await prisma.availability.findFirst({
          where: {
            teacherId,
            isSpecial:    true,
            specificDate: new Date(`${specificDate}T12:00:00`),
            startTime:    slot.startTime,
            endTime:      slot.endTime,
            active:       true,
          },
        })
        if (existing) { skipped.push(slot.startTime); continue }

        const avail = await prisma.availability.create({
          data: {
            teacherId,
            dayOfWeek:    resolvedDayOfWeek,
            specificDate: new Date(`${specificDate}T12:00:00`),
            isSpecial:    true,
            startTime:    slot.startTime,
            endTime:      slot.endTime,
          },
          include: { teacher: true },
        })
        created.push(avail)
      } else {
        // Duplicata recorrente: mesmo professor, mesmo dia, mesmo horário
        const existing = await prisma.availability.findFirst({
          where: {
            teacherId,
            dayOfWeek:  resolvedDayOfWeek,
            isSpecial:  false,
            startTime:  slot.startTime,
            endTime:    slot.endTime,
            active:     true,
          },
        })
        if (existing) { skipped.push(slot.startTime); continue }

        const avail = await prisma.availability.create({
          data: {
            teacherId,
            dayOfWeek: resolvedDayOfWeek,
            startTime: slot.startTime,
            endTime:   slot.endTime,
            // isSpecial e specificDate ficam com defaults (false / null)
          },
          include: { teacher: true },
        })
        created.push(avail)
      }
    }

    if (created.length === 0) {
      return NextResponse.json(
        { error: 'Todos os slots já existem para este professor neste ' + (isSpecial ? 'dia especial.' : 'dia da semana.') },
        { status: 409 }
      )
    }

    return NextResponse.json({ created, skipped }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar disponibilidade' }, { status: 500 })
  }
}