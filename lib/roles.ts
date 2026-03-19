// lib/roles.ts
// Centraliza a lógica de roles para reuso nas APIs e no frontend

export type Role = 'geral' | 'fund1' | 'fund2'

// Séries de cada role
export const GRADES_BY_ROLE: Record<Role, string[]> = {
  geral: [], // vazio = sem restrição (vê tudo)
  fund1: [
    'Educação Infantil',
    '1º Ano Fundamental', '2º Ano Fundamental', '3º Ano Fundamental',
    '4º Ano Fundamental', '5º Ano Fundamental',
  ],
  fund2: [
    '6º Ano Fundamental', '7º Ano Fundamental',
    '8º Ano Fundamental', '9º Ano Fundamental',
    '1ª Série Médio', '2ª Série Médio', '3ª Série Médio',
  ],
}

export function getGradesForRole(role: string): string[] {
  return GRADES_BY_ROLE[role as Role] ?? []
}

export function isGeral(role: string): boolean {
  return role === 'geral'
}

/** Filtra lista de séries pelo role */
export function filterGradesByRole(grades: string[], role: string): string[] {
  if (isGeral(role)) return grades
  const allowed = getGradesForRole(role)
  return grades.filter(g => allowed.includes(g))
}