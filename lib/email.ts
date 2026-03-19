// ============================================================
// ARQUIVO: lib/email.ts
// /lib/email.ts
// ============================================================
import nodemailer from 'nodemailer'
import { generateCalendarLink } from './calendar-link'
import { formatDateShort } from './slots'

export interface AppointmentEmailData {
  parentName: string
  parentEmail: string
  studentName: string
  studentGrade: string
  teacherName: string
  teacherEmail: string
  subject: string
  date: string
  startTime: string
  endTime: string
  reason: string
}

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_PASS!,
    },
  })
}

export async function sendConfirmationToParent(data: AppointmentEmailData) {
  const transporter   = createTransport()
  const dateFormatted = formatDateShort(data.date)
  const calendarLink  = generateCalendarLink({
    title:       `Reunião Pro Campus — ${data.subject}`,
    date:        new Date(data.date).toISOString().split('T')[0],
    startTime:   data.startTime,
    endTime:     data.endTime,
    description: `Professor(a): ${data.teacherName}\nDisciplina: ${data.subject} — ${data.studentGrade}\nAluno: ${data.studentName}\nMotivo: ${data.reason}`,
  })

  try {
    await transporter.sendMail({
      from:    `"Pro Campus" <${process.env.GMAIL_USER}>`,
      to:      data.parentEmail,
      subject: `✅ Reunião confirmada — ${data.subject} | Pro Campus`,
      html:    buildParentEmail(data, dateFormatted, calendarLink),
    })
  } catch (err) {
    console.error('Erro ao enviar e-mail para o pai:', err)
  }
}

export async function sendNotificationToTeacher(data: AppointmentEmailData) {
  const transporter   = createTransport()
  const dateFormatted = formatDateShort(data.date)

  try {
    await transporter.sendMail({
      from:    `"Pro Campus" <${process.env.GMAIL_USER}>`,
      to:      data.teacherEmail,
      subject: `📅 Nova reunião agendada — ${data.subject} | Pro Campus`,
      html:    buildTeacherEmail(data, dateFormatted),
    })
  } catch (err) {
    console.error('Erro ao enviar e-mail para o professor:', err)
  }
}

export async function sendCancellationToParent(data: {
  parentName: string
  parentEmail: string
  studentName: string
  studentGrade: string
  teacherName: string
  subject: string
  date: string
  startTime: string
}) {
  const transporter   = createTransport()
  const dateFormatted = formatDateShort(data.date)

  try {
    await transporter.sendMail({
      from:    `"Pro Campus" <${process.env.GMAIL_USER}>`,
      to:      data.parentEmail,
      subject: `❌ Reunião cancelada — ${data.subject} | Pro Campus`,
      html:    buildCancellationEmail({ ...data, date: dateFormatted }),
    })
  } catch (err) {
    console.error('Erro ao enviar e-mail de cancelamento:', err)
  }
}

// ── Templates HTML ────────────────────────────────────────

function buildParentEmail(
  data: AppointmentEmailData,
  dateFormatted: string,
  calendarLink: string
): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0faf2;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0faf2;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(97,206,112,0.15);">

  <tr><td style="background:linear-gradient(135deg,#0D2818,#1a7a2e,#23A455);padding:40px;text-align:center;">
    <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0;">Pro Campus</h1>
    <p style="color:rgba(255,255,255,0.65);margin:8px 0 0;font-size:14px;">Grupo Educacional — Teresina, PI</p>
  </td></tr>

  <tr><td style="padding:28px 40px 0;text-align:center;">
    <div style="display:inline-block;background:#dcfce7;color:#16a34a;padding:8px 20px;border-radius:100px;font-size:13px;font-weight:700;">
      ✅ Reunião Confirmada
    </div>
  </td></tr>

  <tr><td style="padding:20px 40px 0;">
    <h2 style="color:#0D2818;font-size:20px;font-weight:700;margin:0;">Olá, ${data.parentName}!</h2>
    <p style="color:#6b8f72;font-size:14px;line-height:1.6;margin:10px 0 0;">
      Sua reunião pedagógica foi agendada com sucesso. Veja os detalhes:
    </p>
  </td></tr>

  <tr><td style="padding:20px 40px;">
    <table width="100%" style="background:#f7fdf8;border-radius:14px;border:1px solid rgba(97,206,112,0.15);overflow:hidden;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(97,206,112,0.1);">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Professor(a)</span>
        <p style="color:#0a1a0d;font-size:15px;font-weight:700;margin:4px 0 0;">${data.teacherName}</p>
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(97,206,112,0.1);">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Disciplina / Série</span>
        <p style="color:#0a1a0d;font-size:15px;font-weight:700;margin:4px 0 0;">${data.subject} — ${data.studentGrade}</p>
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(97,206,112,0.1);">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Aluno</span>
        <p style="color:#0a1a0d;font-size:15px;font-weight:700;margin:4px 0 0;">${data.studentName}</p>
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(97,206,112,0.1);">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Data e Horário</span>
        <p style="color:#23A455;font-size:20px;font-weight:800;margin:4px 0 0;">📅 ${dateFormatted} às ${data.startTime}</p>
        <p style="color:#6b8f72;font-size:12px;margin:4px 0 0;">Duração: 20 minutos</p>
      </td></tr>
      <tr><td style="padding:16px 20px;">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Motivo</span>
        <p style="color:#0a1a0d;font-size:14px;margin:4px 0 0;">${data.reason}</p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 40px 28px;text-align:center;">
    <a href="${calendarLink}" target="_blank"
       style="display:inline-block;background:linear-gradient(135deg,#23A455,#61CE70);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">
      📆 Adicionar ao Google Agenda
    </a>
    <p style="color:#6b8f72;font-size:12px;margin:10px 0 0;">Salve no calendário e receba lembrete automático</p>
  </td></tr>

  <tr><td style="padding:0 40px 28px;">
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 18px;">
      <p style="color:#c2410c;font-size:13px;font-weight:600;margin:0;">📍 Local: Grupo Educacional Pro Campus — Teresina, PI</p>
      <p style="color:#92400e;font-size:12px;margin:6px 0 0;">Apresente-se à secretaria com 5 minutos de antecedência.</p>
    </div>
  </td></tr>

  <tr><td style="background:#f7fdf8;padding:20px 40px;text-align:center;border-top:1px solid rgba(97,206,112,0.1);">
    <p style="color:#6b8f72;font-size:12px;margin:0;">© ${new Date().getFullYear()} Grupo Educacional Pro Campus — Teresina, Piauí</p>
    <p style="color:#6b8f72;font-size:11px;margin:5px 0 0;">Dúvidas? (86) 2106-0606</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function buildTeacherEmail(data: AppointmentEmailData, dateFormatted: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0faf2;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0faf2;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(97,206,112,0.15);">

  <tr><td style="background:linear-gradient(135deg,#0D2818,#1a7a2e,#23A455);padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Pro Campus</h1>
    <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Sistema de Plantão Escolar</p>
  </td></tr>

  <tr><td style="padding:28px 40px 0;">
    <h2 style="color:#0D2818;font-size:18px;font-weight:700;margin:0;">
      Nova reunião agendada, Prof. ${data.teacherName}!
    </h2>
    <p style="color:#6b8f72;font-size:14px;line-height:1.6;margin:10px 0 0;">
      Um responsável agendou uma reunião com você. Veja os detalhes:
    </p>
  </td></tr>

  <tr><td style="padding:20px 40px 32px;">
    <table width="100%" style="background:#f7fdf8;border-radius:14px;border:1px solid rgba(97,206,112,0.15);overflow:hidden;">
      <tr><td style="padding:14px 18px;border-bottom:1px solid rgba(97,206,112,0.1);">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;">Responsável</span>
        <p style="color:#0a1a0d;font-size:14px;font-weight:700;margin:3px 0 0;">${data.parentName}</p>
      </td></tr>
      <tr><td style="padding:14px 18px;border-bottom:1px solid rgba(97,206,112,0.1);">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;">Aluno / Série</span>
        <p style="color:#0a1a0d;font-size:14px;font-weight:700;margin:3px 0 0;">${data.studentName} — ${data.studentGrade}</p>
      </td></tr>
      <tr><td style="padding:14px 18px;border-bottom:1px solid rgba(97,206,112,0.1);">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;">Data e Hora</span>
        <p style="color:#23A455;font-size:18px;font-weight:800;margin:3px 0 0;">${dateFormatted} às ${data.startTime}</p>
      </td></tr>
      <tr><td style="padding:14px 18px;border-bottom:1px solid rgba(97,206,112,0.1);">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;">Disciplina / Série</span>
        <p style="color:#0a1a0d;font-size:14px;font-weight:700;margin:3px 0 0;">${data.subject} — ${data.studentGrade}</p>
      </td></tr>
      <tr><td style="padding:14px 18px;">
        <span style="color:#6b8f72;font-size:11px;font-weight:700;text-transform:uppercase;">Motivo</span>
        <p style="color:#0a1a0d;font-size:14px;margin:3px 0 0;">${data.reason}</p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="background:#f7fdf8;padding:18px 40px;text-align:center;border-top:1px solid rgba(97,206,112,0.1);">
    <p style="color:#6b8f72;font-size:12px;margin:0;">© ${new Date().getFullYear()} Grupo Educacional Pro Campus</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function buildCancellationEmail(data: {
  parentName: string
  studentName: string
  teacherName: string
  subject: string
  studentGrade: string
  date: string
  startTime: string
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fef2f2;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(239,68,68,0.1);">

  <tr><td style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:36px 40px;text-align:center;">
    <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Pro Campus</h1>
    <p style="color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:13px;">Grupo Educacional — Teresina, PI</p>
  </td></tr>

  <tr><td style="padding:28px 40px 0;text-align:center;">
    <div style="display:inline-block;background:#fef2f2;color:#dc2626;padding:8px 20px;border-radius:100px;font-size:13px;font-weight:700;border:1px solid #fecaca;">
      ❌ Reunião Cancelada
    </div>
  </td></tr>

  <tr><td style="padding:20px 40px 0;">
    <h2 style="color:#1a1a1a;font-size:18px;font-weight:700;margin:0;">Olá, ${data.parentName}!</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:10px 0 0;">
      Infelizmente a reunião abaixo foi <strong style="color:#dc2626;">cancelada</strong> pela secretaria.
      Entre em contato para reagendar quando necessário.
    </p>
  </td></tr>

  <tr><td style="padding:20px 40px;">
    <table width="100%" style="background:#fafafa;border-radius:14px;border:1px solid #fee2e2;overflow:hidden;">
      <tr><td style="padding:14px 20px;border-bottom:1px solid #fee2e2;">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Professor(a)</span>
        <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:4px 0 0;">${data.teacherName}</p>
      </td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #fee2e2;">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Disciplina / Série</span>
        <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:4px 0 0;">${data.subject} — ${data.studentGrade}</p>
      </td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #fee2e2;">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Aluno</span>
        <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:4px 0 0;">${data.studentName}</p>
      </td></tr>
      <tr><td style="padding:14px 20px;">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Data e Horário cancelados</span>
        <p style="color:#dc2626;font-size:18px;font-weight:800;margin:4px 0 0;text-decoration:line-through;opacity:0.7;">
          📅 ${data.date} às ${data.startTime}
        </p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 40px 28px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;">
      <p style="color:#15803d;font-size:13px;font-weight:600;margin:0;">
        💬 Para reagendar, acesse o site ou entre em contato: (86) 2106-0606
      </p>
    </div>
  </td></tr>

  <tr><td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #fee2e2;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Grupo Educacional Pro Campus — Teresina, Piauí</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}