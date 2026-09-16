import { getSelectableGradesForRole } from './roles'

export class BlockInputError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) {
    throw new BlockInputError(`${label}: envie uma lista válida.`)
  }
  return [...new Set(value.map(item => item.trim()))].sort()
}

/** Escopos explícitos impedem uma seleção vazia de virar um bloqueio geral. */
export function parseBlockSelection(body: Record<string, unknown>, role: string) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BlockInputError('Envie os dados do bloqueio.')
  if (body.teacherId !== undefined && body.teacherId !== null && typeof body.teacherId !== 'string') throw new BlockInputError('Professor inválido.')
  const allowed = getSelectableGradesForRole(role)
  if (!allowed.length) throw new BlockInputError('Acesso não autorizado.', 403)
  const legacyTeacher = typeof body.teacherId === 'string' && body.teacherId.trim() ? body.teacherId.trim() : null
  const teacherScope = body.teacherScope ?? (body.teacherIds !== undefined || legacyTeacher ? 'selected' : 'all')
  if (teacherScope !== 'all' && teacherScope !== 'selected') throw new BlockInputError('Escolha o grupo de professores.')
  const teacherIds = body.teacherIds !== undefined ? stringList(body.teacherIds, 'Professores') : legacyTeacher ? [legacyTeacher] : []
  if (teacherScope === 'selected' && !teacherIds.length) throw new BlockInputError('Selecione pelo menos um professor.')
  if (teacherScope === 'all' && teacherIds.length) throw new BlockInputError('Revise o grupo de professores selecionado.')

  const grades = body.grades === undefined ? [] : stringList(body.grades, 'Séries')
  const gradeScope = body.gradeScope ?? (grades.length ? 'selected' : 'all')
  if (gradeScope !== 'all' && gradeScope !== 'selected') throw new BlockInputError('Escolha as séries afetadas.')
  if (gradeScope === 'selected' && !grades.length) throw new BlockInputError('Selecione pelo menos uma série.')
  if (gradeScope === 'all' && grades.length) throw new BlockInputError('Revise as séries selecionadas.')
  if (grades.some(grade => !allowed.includes(grade))) throw new BlockInputError('Série fora do seu nível de acesso.', 403)
  return { teacherIds, grades: grades.sort((a, b) => allowed.indexOf(a) - allowed.indexOf(b)) }
}

export function blockStorageError(error: unknown) {
  const code = (error as { code?: string } | null)?.code
  return code === 'P2021' || code === 'P2022'
    ? 'A atualização dos bloqueios ainda não foi aplicada ao banco. Solicite ao administrador que execute npx prisma migrate deploy.'
    : 'Não foi possível acessar os bloqueios. Tente novamente.'
}
