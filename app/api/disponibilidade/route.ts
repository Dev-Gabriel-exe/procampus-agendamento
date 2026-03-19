// ============================================================
// ARQUIVO: app/api/disponibilidade/route.ts
// CAMINHO: app/api/disponibilidade/route.ts
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNextOccurrences } from '@/lib/slots'

export const dynamic = 'force-dynamic'

// ✅ Gera slots de 20 minutos
function generateSlots20(startTime: string, endTime: string) {
  const slots: { startTime: string; endTime: string }[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let current = sh * 60 + sm
  const end   = eh * 60 + em
  while (current + 20 <= end) {
    const s = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    current += 20
    const e = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    slots.push({ startTime: s, endTime: e })
  }
  return slots
}

function sameDay(a: Date, b: Date): boolean {
  const off = 3 * 60 * 60 * 1000
  const aB  = new Date(a.getTime() - off)
  const bB  = new Date(b.getTime() - off)
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

    // ✅ FIX: deduplica teacherIds (evita professores duplicados)
    const teacherIds = [...new Set(teacherSubjects.map(ts => ts.teacherId))]
    if (teacherIds.length === 0) return NextResponse.json([])

    const availabilities = await prisma.availability.findMany({
      where: { teacherId: { in: teacherIds }, active: true },
      include: { teacher: true },
    })

    if (availabilities.length === 0) return NextResponse.json([])

    const from = new Date()
    from.setUTCDate(from.getUTCDate() - 1)
    from.setUTCHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setUTCDate(from.getUTCDate() + 30)

    const bookedAppts = await prisma.appointment.findMany({
      where: {
        availabilityId: { in: availabilities.map(a => a.id) },
        status: 'confirmed',
        date:   { gte: from, lte: to },
      },
      select: { availabilityId: true, date: true, startTime: true },
    })

    const nowBrasilia = new Date(Date.now() - 3 * 60 * 60 * 1000)

    const result: any[] = []

    // ✅ FIX: chave de deduplicação por data + horário + professor
    // Impede que o mesmo professor apareça duas vezes no mesmo slot
    const seen = new Set<string>()

    for (const avail of availabilities) {
      const dates = getNextOccurrences(avail.dayOfWeek, 4)
      const slots = generateSlots20(avail.startTime, avail.endTime)

      for (const date of dates) {
        for (const slot of slots) {

          // Filtra slots passados
          const [slotH, slotM] = slot.startTime.split(':').map(Number)
          const slotDateBrasilia = new Date(date.getTime() - 3 * 60 * 60 * 1000)
          slotDateBrasilia.setUTCHours(slotH, slotM, 0, 0)
          if (slotDateBrasilia <= nowBrasilia) continue

          // ✅ Chave única: availabilityId + dateISO + startTime
          // Garante que cada disponibilidade só aparece uma vez por slot
          const dateISO = date.toISOString().split('T')[0]
          const key = `${avail.id}|${dateISO}|${slot.startTime}`
          if (seen.has(key)) continue
          seen.add(key)

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