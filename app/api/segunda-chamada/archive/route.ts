import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const data = await prisma.examSchedule.findMany({
    where: { archived: true },
    include: { bookings: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { ids, archived } = await req.json()
  await prisma.examSchedule.updateMany({
    where: { id: { in: ids } },
    data: { archived, archivedAt: archived ? new Date() : null },
  })
  return NextResponse.json({ ok: true })
}
