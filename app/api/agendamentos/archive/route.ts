import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — lista arquivados
export async function GET() {
  const data = await prisma.appointment.findMany({
    where: { archived: true },
    include: { availability: { include: { teacher: true } } },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(data)
}

// PATCH — arquivar ou desarquivar IDs
export async function PATCH(req: NextRequest) {
  const { ids, archived } = await req.json()
  await prisma.appointment.updateMany({
    where: { id: { in: ids } },
    data: { archived, archivedAt: archived ? new Date() : null },
  })
  return NextResponse.json({ ok: true })
}
