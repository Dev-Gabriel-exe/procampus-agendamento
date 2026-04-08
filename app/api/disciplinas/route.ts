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
    const body = await req.json()
    const { name, grades } = body
    
    // Aceita tanto o formato antigo (grade) quanto o novo (grades array)
    const gradesToCreate = grades || (body.grade ? [body.grade] : null)
    
    if (!name || !gradesToCreate) {
      return NextResponse.json({ error: 'Nome e série(s) obrigatória(s)' }, { status: 400 })
    }

    if (!Array.isArray(gradesToCreate)) {
      return NextResponse.json({ error: 'Grades deve ser um array' }, { status: 400 })
    }

    // Verifica permissões
    if (!isGeral(role)) {
      const allowed = getGradesForRole(role)
      const unauthorized = gradesToCreate.filter(g => !allowed.includes(g))
      if (unauthorized.length > 0) {
        return NextResponse.json({ error: `Série(s) fora do seu nível de acesso: ${unauthorized.join(', ')}` }, { status: 403 })
      }
    }

    // Cria a disciplina para cada série
    const created: any[] = []
    const errors: any[] = []

    for (const grade of gradesToCreate) {
      try {
        // Verifica se já existe
        const existing = await prisma.subject.findFirst({ where: { name, grade } })
        if (existing) {
          errors.push({ grade, error: 'Já existe para esta série' })
          continue
        }

        const id = `${name}-${grade}`.toLowerCase().replace(/[\sºªç\/áéíóúãõâêî]/g, c => {
          const map: Record<string, string> = { 'á':'a','é':'e','í':'i','ó':'o','ú':'u','ã':'a','õ':'o','â':'a','ê':'e','î':'i','ç':'c',' ':'-','º':'-','ª':'-','/':'-' }
          return map[c] ?? c
        }).replace(/-+/g, '-')

        const subject = await prisma.subject.create({ data: { id, name, grade } })
        created.push(subject)
      } catch (err) {
        errors.push({ grade, error: String(err) })
      }
    }

    if (created.length === 0) {
      return NextResponse.json({ error: 'Nenhuma série foi criada', errors }, { status: 409 })
    }

    return NextResponse.json({ created, errors: errors.length > 0 ? errors : undefined }, { status: 201 })
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