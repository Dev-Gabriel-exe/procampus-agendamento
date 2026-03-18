// ============================================================
// ARQUIVO: src/lib/whatsapp-link.ts
// CAMINHO: procampus-agendamento/src/lib/whatsapp-link.ts
// ============================================================
 
interface WhatsAppLinkParams {
  phone: string
  teacherName: string
  parentName: string
  studentName: string
  date: string       // "20/01/2025"
  startTime: string  // "08:00"
  subject: string
  grade: string
  reason: string
}
 
export function generateWhatsAppLink({
  phone, teacherName, parentName, studentName,
  date, startTime, subject, grade, reason,
}: WhatsAppLinkParams) {
  const message =
    `Ola, Prof. ${teacherName}!\n\n` +
    `*NOVA REUNIAO PEDAGOGICA*\n\n` +
    `Responsavel: ${parentName}\n` +
    `Aluno: ${studentName}\n` +
    `Disciplina: ${subject}\n` +
    `Serie: ${grade}\n` +
    `Data: ${date}\n` +
    `Horario: ${startTime} (30 minutos)\n` +
    `Motivo: ${reason}\n\n` +
    `_Sistema de Agendamento Pro Campus_`
 
  const cleaned = phone.replace(/\D/g, '')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}