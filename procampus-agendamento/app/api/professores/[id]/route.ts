import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { name, email, phone, subjectIds } = await req.json()
    await prisma.teacherSubject.deleteMany({ where: { teacherId: params.id } })
    const teacher = await prisma.teacher.update({
      where: { id: params.id },
      data: {
        name, email, phone,
        subjects: { create: subjectIds?.map((id: string) => ({ subjectId: id })) ?? [] },
      },
      include: { subjects: { include: { subject: true } } },
    })
    return NextResponse.json(teacher)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar professor' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    await prisma.teacher.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir professor' }, { status: 500 })
  }
}
