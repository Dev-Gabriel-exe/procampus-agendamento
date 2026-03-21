// app/api/segunda-chamada/route.ts

// app/api/segunda-chamada/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isPublic    = searchParams.get('public') === 'true'
    const grade       = searchParams.get('grade')
    const subjectName = searchParams.get('subject')

    const where: any = { active: true }

    if (isPublic) {
      // ✅ Rota pública — sem auth, só provas futuras
      where.date = { gte: new Date() }
      if (grade)       where.grade       = grade
      if (subjectName) where.subjectName = subjectName
    } else {
      // Rota da secretaria — requer auth
      const session = await auth()
      if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

      const role = (session.user as any)?.role ?? 'geral'

      // ✅ FIX: filtra por série (grade) e não por role
      // fund1/fund2 veem provas das suas séries independente de quem criou
      if (!isGeral(role)) {
        const allowedGrades = getGradesForRole(role)
        where.grade = { in: allowedGrades }
      }
      // geral vê tudo — sem filtro adicional

      if (grade)       where.grade       = grade
      if (subjectName) where.subjectName = subjectName
    }

    const exams = await prisma.examSchedule.findMany({
      where,
      include: {
        bookings: {
          where: { status: 'confirmed' },
          select: { id: true, studentName: true, parentName: true, parentEmail: true, parentPhone: true, createdAt: true },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(exams)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao buscar provas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any)?.role ?? 'geral'

  try {
    const { subjectId, subjectName, grade, date, startTime, endTime } = await req.json()

    if (!subjectId || !subjectName || !grade || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Valida série pelo role
    if (!isGeral(role)) {
      const allowedGrades = getGradesForRole(role)
      if (!allowedGrades.includes(grade)) {
        return NextResponse.json({ error: 'Série fora do seu nível de acesso.' }, { status: 403 })
      }
    }

    const raw = date.split('T')[0]
    const [year, month, day] = raw.split('-').map(Number)
    const examDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))

    const existing = await prisma.examSchedule.findFirst({
      where: { subjectId, grade, date: examDate, startTime, endTime, active: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'Este slot já existe para esta disciplina.' }, { status: 409 })
    }

    const exam = await prisma.examSchedule.create({
      data: { subjectId, subjectName, grade, date: examDate, startTime, endTime, role },
      include: { bookings: true },
    })

    return NextResponse.json(exam, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar slot' }, { status: 500 })
  }
}