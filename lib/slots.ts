// ============================================================
// ARQUIVO: lib/slots.ts
// CAMINHO: lib/slots.ts (raiz do projeto)
// ============================================================

export function generateSlots(startTime: string, endTime: string) {
  const slots: { startTime: string; endTime: string }[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let current = sh * 60 + sm
  const end   = eh * 60 + em

  while (current + 30 <= end) {
    const s = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    current += 30
    const e = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    slots.push({ startTime: s, endTime: e })
  }
  return slots
}

export function getNextOccurrences(dayOfWeek: number, weeks = 4): Date[] {
  const dates: Date[] = []
  const now = new Date()

  // Dia atual em Brasília (UTC-3)
  // Subtraímos 3h para saber qual dia é em Brasília agora
  const brasiliaOffset = 3 * 60 * 60 * 1000 // 3 horas em ms
  const brasiliaTime   = new Date(now.getTime() - brasiliaOffset)
  const todayDay       = brasiliaTime.getUTCDay()   // dia da semana em Brasília
  const todayY         = brasiliaTime.getUTCFullYear()
  const todayM         = brasiliaTime.getUTCMonth()
  const todayD         = brasiliaTime.getUTCDate()

  for (let w = 0; w < weeks; w++) {
    const diff      = (dayOfWeek - todayDay + 7) % 7
    let   daysToAdd = diff + w * 7

    // Se é hoje (diff===0, w===0), inclui apenas se ainda é cedo
    // Caso contrário pula para próxima semana
    if (diff === 0 && w === 0) {
      const brasiliaHour = brasiliaTime.getUTCHours()
      if (brasiliaHour >= 17) {
        // Já passou das 17h em Brasília — pula para próxima semana
        daysToAdd = 7
      }
    }

    // Gera a data ao MEIO-DIA UTC (12:00Z = 09:00 Brasília)
    // Isso garante que a data nunca "escorrega" para o dia anterior
    // quando convertida para o fuso de Brasília (UTC-3)
    const date = new Date(Date.UTC(todayY, todayM, todayD + daysToAdd, 12, 0, 0, 0))
    dates.push(date)
  }

  return dates
}

export function formatTime(time: string) {
  return time.replace(':', 'h')
}

export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    timeZone: 'America/Fortaleza', // Teresina usa horário de Fortaleza (UTC-3 sem DST)
  })
}

export function formatDateShort(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Fortaleza',
  })
}

export function getWeekRange(date: Date) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}