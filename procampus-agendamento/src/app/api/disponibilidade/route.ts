// ============================================================
// ARQUIVO: src/app/api/disponibilidade/route.ts
// CAMINHO: procampus-agendamento/src/app/api/disponibilidade/route.ts
// SUBSTITUA o arquivo inteiro
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlots, getNextOccurrences } from '@/lib/slots'

// Compara apenas YYYY-MM-DD em UTC — mais simples e seguro
function sameDay(a: Date, b: Date): boolean {
  const aStr = a.toISOString().slice(0, 10) // "2026-03-18"
  const bStr = b.toISOString().slice(0, 10) // "2026-03-18"
  return aStr === bStr
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const grade       = searchParams.get('grade')
    const subjectName = searchParams.get('subject')

    if (!grade || !subjectName) {
      return NextResponse.json({ error: 'grade e subject são obrigatórios' }, { status: 400 })
    }

    // Professores que ensinam essa disciplina nessa série
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { subject: { name: subjectName, grade } },
      include: { teacher: true },
    })

    const teacherIds = teacherSubjects.map(ts => ts.teacherId)
    if (teacherIds.length === 0) return NextResponse.json([])

    // Disponibilidades recorrentes ativas
    const availabilities = await prisma.availability.findMany({
      where: { teacherId: { in: teacherIds }, active: true },
      include: { teacher: true },
    })

    if (availabilities.length === 0) return NextResponse.json([])

    // Janela de 4 semanas
    const now = new Date()
    now.setUTCHours(0, 0, 0, 0)  // ← meia-noite UTC, pega hoje inteiro
    const in4w = new Date(now)
    in4w.setUTCDate(now.getUTCDate() + 28)

    // Todos os agendamentos confirmados nas próximas 4 semanas
    const bookedAppts = await prisma.appointment.findMany({
      where: {
        availabilityId: { in: availabilities.map(a => a.id) },
        status: 'confirmed',
        date: { gte: now, lte: in4w },
      },
      select: { availabilityId: true, date: true, startTime: true },
    })

    // DEBUG — remove depois de confirmar que funciona
    console.log('=== BOOKED APPOINTMENTS ===')
    bookedAppts.forEach(b => {
      console.log(`  availId=${b.availabilityId} | date=${b.date.toISOString()} | time=${b.startTime}`)
    })

    const result: any[] = []

    for (const avail of availabilities) {
      const dates = getNextOccurrences(avail.dayOfWeek, 4)
      const slots = generateSlots(avail.startTime, avail.endTime)

      // DEBUG
      console.log(`\n=== AVAIL ${avail.id} (day ${avail.dayOfWeek}) ===`)
      dates.forEach(d => console.log(`  generated date: ${d.toISOString()}`))

      for (const date of dates) {
        for (const slot of slots) {
          const isBooked = bookedAppts.some(b => {
            if (b.availabilityId !== avail.id)     return false
            if (b.startTime      !== slot.startTime) return false
            const match = sameDay(new Date(b.date), date)
            if (match) {
              console.log(`  MATCH BOOKED: ${slot.startTime} on ${date.toISOString().slice(0,10)}`)
            }
            return match
          })

          result.push({
            availabilityId: avail.id,
            date,
            dateLabel: date.toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long',
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