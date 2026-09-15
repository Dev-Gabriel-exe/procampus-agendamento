export type ScheduleBlockLike = {
  startDate: Date | string
  endDate: Date | string
  teacherId: string | null
  role: string
}

export type TeacherScope = {
  id: string
  role: string
}

/** Converte YYYY-MM-DD para meio-dia UTC e rejeita datas inexistentes. */
export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null

  return date
}

export function toUtcNoon(value: Date | string): Date {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    12, 0, 0, 0,
  ))
}

export function isDateInsideBlock(date: Date | string, block: ScheduleBlockLike): boolean {
  const value = toUtcNoon(date).getTime()
  return value >= toUtcNoon(block.startDate).getTime() && value <= toUtcNoon(block.endDate).getTime()
}

/**
 * Bloqueio individual vale apenas para o professor escolhido.
 * Bloqueio coletivo criado pelo acesso geral vale para todos; os demais
 * acessos coletivos valem para professores do mesmo nível.
 */
export function blockAppliesToTeacher(block: ScheduleBlockLike, teacher: TeacherScope): boolean {
  if (block.teacherId) return block.teacherId === teacher.id
  return block.role === 'geral' || block.role === teacher.role
}

export function blocksTeacherOnDate(
  blocks: ScheduleBlockLike[],
  teacher: TeacherScope,
  date: Date | string,
): ScheduleBlockLike | undefined {
  return blocks.find(block => blockAppliesToTeacher(block, teacher) && isDateInsideBlock(date, block))
}

/** Converte data + horário de Fortaleza (UTC-3) para instante UTC. */
export function appointmentStartUtc(date: Date | string, startTime: string): Date {
  const day = toUtcNoon(date)
  const [hours, minutes] = startTime.split(':').map(Number)
  return new Date(Date.UTC(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate(),
    hours + 3,
    minutes,
    0,
    0,
  ))
}
