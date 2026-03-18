import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      include: { subjects: { include: { subject: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(teachers)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar professores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { name, email, phone, subjectIds } = await req.json()
    if (!name || !email || !phone)
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })

    const teacher = await prisma.teacher.create({
      data: {
        name, email, phone,
        subjects: { create: subjectIds?.map((id: string) => ({ subjectId: id })) ?? [] },
      },
      include: { subjects: { include: { subject: true } } },
    })
    return NextResponse.json(teacher, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar professor' }, { status: 500 })
  }
}
