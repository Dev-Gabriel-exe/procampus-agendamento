// app/api/disciplinas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gradeFilter = searchParams.get('grade')

    let roleGrades: string[] = []
    try {
      const session = await auth()
      const role = (session?.user as any)?.role
      if (role && !isGeral(role)) {
        roleGrades = getGradesForRole(role)
      }
    } catch { /* rota pública */ }

    const where: any = {}
    if (gradeFilter) where.grade = gradeFilter
    if (roleGrades.length > 0) where.grade = { in: roleGrades }

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    })

    // ✅ FIX: deduplica por name+grade — remove entradas duplicadas do banco
    const seen = new Set<string>()
    const unique = subjects.filter(s => {
      const key = `${s.name}|${s.grade}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json(unique)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar disciplinas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any)?.role ?? 'geral'

  try {
    const { name, grade } = await req.json()
    if (!name || !grade) return NextResponse.json({ error: 'Nome e série obrigatórios' }, { status: 400 })

    // Verifica se o role tem permissão para essa série
    if (!isGeral(role)) {
      const allowed = getGradesForRole(role)
      if (!allowed.includes(grade)) {
        return NextResponse.json({ error: 'Série fora do seu nível de acesso.' }, { status: 403 })
      }
    }

    // Verifica se já existe
    const existing = await prisma.subject.findFirst({ where: { name, grade } })
    if (existing) return NextResponse.json({ error: 'Esta disciplina já existe para esta série.' }, { status: 409 })

    const id = `${name}-${grade}`.toLowerCase().replace(/[\sºªç\/áéíóúãõâêî]/g, c => {
      const map: Record<string, string> = { 'á':'a','é':'e','í':'i','ó':'o','ú':'u','ã':'a','õ':'o','â':'a','ê':'e','î':'i','ç':'c',' ':'-','º':'-','ª':'-','/':'-' }
      return map[c] ?? c
    }).replace(/-+/g, '-')

    const subject = await prisma.subject.create({ data: { id, name, grade } })
    return NextResponse.json(subject, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar disciplina' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    // Verifica se há professores usando essa disciplina
    const inUse = await prisma.teacherSubject.findFirst({ where: { subjectId: id } })
    if (inUse) return NextResponse.json({ error: 'Disciplina em uso por um professor.' }, { status: 409 })

    await prisma.subject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao apagar disciplina' }, { status: 500 })
  }
}