// ============================================================
// ARQUIVO: app/api/disponibilidade/route.ts
// CAMINHO: app/api/disponibilidade/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlots, getNextOccurrences } from '@/lib/slots'

// Compara datas usando o dia em Brasília (UTC-3)
// Resolve o bug de "aparecer um dia antes"
function sameDay(a: Date, b: Date): boolean {
  const brasiliaOffset = 3 * 60 * 60 * 1000

  const aB = new Date(a.getTime() - brasiliaOffset)
  const bB = new Date(b.getTime() - brasiliaOffset)

  return (
    aB.getUTCFullYear() === bB.getUTCFullYear() &&
    aB.getUTCMonth()    === bB.getUTCMonth()    &&
    aB.getUTCDate()     === bB.getUTCDate()
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const grade       = searchParams.get('grade')
    const subjectName = searchParams.get('subject')

    if (!grade || !subjectName) {
      return NextResponse.json({ error: 'grade e subject são obrigatórios' }, { status: 400 })
    }

    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { subject: { name: subjectName, grade } },
      include: { teacher: true },
    })

    const teacherIds = teacherSubjects.map(ts => ts.teacherId)
    if (teacherIds.length === 0) return NextResponse.json([])

    const availabilities = await prisma.availability.findMany({
      where: { teacherId: { in: teacherIds }, active: true },
      include: { teacher: true },
    })

    if (availabilities.length === 0) return NextResponse.json([])

    // Janela: desde ontem (UTC) até 4 semanas, para não perder nada por fuso
    const from = new Date()
    from.setUTCDate(from.getUTCDate() - 1)
    from.setUTCHours(0, 0, 0, 0)

    const to = new Date(from)
    to.setUTCDate(from.getUTCDate() + 30)

    const bookedAppts = await prisma.appointment.findMany({
      where: {
        availabilityId: { in: availabilities.map(a => a.id) },
        status: 'confirmed',
        date: { gte: from, lte: to },
      },
      select: { availabilityId: true, date: true, startTime: true },
    })

    const result: any[] = []

    for (const avail of availabilities) {
      const dates = getNextOccurrences(avail.dayOfWeek, 4)
      const slots = generateSlots(avail.startTime, avail.endTime)

      for (const date of dates) {
        for (const slot of slots) {
          const isBooked = bookedAppts.some(b =>
            b.availabilityId === avail.id &&
            b.startTime      === slot.startTime &&
            sameDay(new Date(b.date), date)
          )

          result.push({
            availabilityId: avail.id,
            date,
            dateLabel: date.toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long',
              timeZone: 'America/Fortaleza',
            }),
            startTime:    slot.startTime,
            endTime:      slot.endTime,
            teacherName:  avail.teacher.name,
            teacherId:    avail.teacherId,
            subjectName,
            subjectGrade: grade,
            isBooked,
          })
        }
      }
    }

    result.sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      return diff !== 0 ? diff : a.startTime.localeCompare(b.startTime)
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao buscar disponibilidade' }, { status: 500 })
  }
}