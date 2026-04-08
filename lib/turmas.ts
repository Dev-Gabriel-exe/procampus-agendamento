// lib/turmas.ts
// ─────────────────────────────────────────────────────────────────
// Edite este arquivo para ajustar as turmas de cada série.
// O pai verá: "6º Ano Fundamental" → seleciona → "Turma A", "Turma B"...
// O valor salvo no banco será: "6º Ano Fundamental - Turma A"
// ─────────────────────────────────────────────────────────────────

export const TURMAS_POR_SERIE: Record<string, string[]> = {
  // ── Educação Infantil ─────────────────────────────────────────
  'Educação Infantil':       ['Turma A', 'Turma B'],

  // ── Ensino Fundamental I ──────────────────────────────────────
  '1º Ano Fundamental':      ['Turma A', 'Turma B' , 'Turma TA'],
  '2º Ano Fundamental':      ['Turma A', 'Turma B', 'Turma C', "Turma TA"],
  '3º Ano Fundamental':      ['Turma A', 'Turma B', 'Turma C', 'Turma TA'],
  '4º Ano Fundamental':      ['Turma A', 'Turma B', 'Turma TA'],
  '5º Ano Fundamental':      ['Turma A', 'Turma B', 'Turma TA'],

  // ── Ensino Fundamental II ─────────────────────────────────────
  '6º Ano Fundamental':      ['Turma A', 'Turma B', 'Turma C'],
  '7º Ano Fundamental':      ['Turma A', 'Turma B'],
  '8º Ano Fundamental':      ['Turma A', 'Turma B'],
  '9º Ano Fundamental':      ['Turma A', 'Turma B'],

  // ── Ensino Médio ──────────────────────────────────────────────
  '1ª Série Médio':          ['Turma A'],
  '2ª Série Médio':          ['Turma A'],
  '3ª Série Médio':          ['Turma A'],
}

/** Retorna as turmas disponíveis para uma série. */
export function getTurmas(grade: string): string[] {
  return TURMAS_POR_SERIE[grade] ?? []
}

/** Monta o valor completo: "6º Ano Fundamental - Turma A" */
export function buildStudentGrade(grade: string, turma: string): string {
  return turma ? `${grade} - ${turma}` : grade
}

/** Extrai a série base de um studentGrade composto. */
export function extractGrade(studentGrade: string): string {
  return studentGrade.includes(' - ') ? studentGrade.split(' - ')[0] : studentGrade
}

/** Extrai a turma de um studentGrade composto. */
export function extractTurma(studentGrade: string): string {
  return studentGrade.includes(' - ') ? studentGrade.split(' - ').slice(1).join(' - ') : ''
}