// app/api/segunda-chamada/booking/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const booking = await prisma.examBooking.update({
      where: { id: params.id },
      data:  { status: 'REJECTED' },
    })
    return NextResponse.json(booking)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao reprovar' }, { status: 500 })
  }
}