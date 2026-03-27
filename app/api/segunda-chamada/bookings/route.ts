// app/api/segunda-chamada/bookings/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import nodemailer from 'nodemailer'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

// ── CLOUDINARY ─────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

// ── EMAIL ─────────────────────────
function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_PASS!,
    },
  })
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const transporter = createTransport()
  await transporter.sendMail({
    from: `"Pro Campus" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const bookings = await prisma.examBooking.findMany({
    include: {
      examSchedule: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(bookings)
}

// ─────────────────────────────────────────────
// POST → criar inscrição (AGORA COMPLETO)
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const studentName = formData.get('studentName') as string
    const studentGrade = formData.get('studentGrade') as string
    const parentName = formData.get('parentName') as string
    const parentEmail = formData.get('parentEmail') as string
    const parentPhone = formData.get('parentPhone') as string
    const examScheduleId = formData.get('examScheduleId') as string

    const reason = formData.get('reason') as string
    const lutoText = formData.get('lutoText') as string
    const justified = formData.get('justified') === 'true'

    const file = formData.get('file') as File | null

    let fileUrl: string | null = null

    // ── upload arquivo ─────────────────
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const upload = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'segunda-chamada' },
          (err, result) => {
            if (err) reject(err)
            else resolve(result)
          }
        ).end(buffer)
      })

      fileUrl = upload.secure_url
    }

    const booking = await prisma.examBooking.create({
      data: {
        studentName,
        studentGrade,
        parentName,
        parentEmail,
        parentPhone,
        examScheduleId,

        status: 'pendente',

        reason,
        lutoText,
        justified,
        fileUrl,
        
      },
    })

    return NextResponse.json(booking)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao criar inscrição' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// PATCH → aprovar / reprovar (MANTIDO + EMAIL)
// ─────────────────────────────────────────────
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id, status, justificativa } = await req.json()

    const booking = await prisma.examBooking.update({
      where: { id },
      include: { examSchedule: true },
      data: {
        status,
        justificativa,
      },
    })

    // ── EMAIL ─────────────────────────
    const html =
      status === 'aprovado'
        ? `<h2>✅ Solicitação Aprovada</h2>
           <p>Olá ${booking.parentName},</p>
           <p>A inscrição de <strong>${booking.studentName}</strong> foi <b>APROVADA</b>.</p>
           <p>Data: ${booking.examSchedule.date}</p>
           <p>Horário: ${booking.examSchedule.startTime}</p>`
        : `<h2>❌ Solicitação Reprovada</h2>
           <p>Olá ${booking.parentName},</p>
           <p>A inscrição de <strong>${booking.studentName}</strong> foi <b>REPROVADA</b>.</p>
           <p>Motivo: ${justificativa || 'Não informado'}</p>`

    await sendEmail({
      to: booking.parentEmail,
      subject:
        status === 'aprovado'
          ? '✅ Segunda chamada aprovada'
          : '❌ Segunda chamada reprovada',
      html,
    })

    return NextResponse.json(booking)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }
}