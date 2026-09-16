// Apenas testes: executa os handlers reais com banco/e-mail isolados em memória.
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')

function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return value.every(item => matches(row, item))
    if (key === 'OR') return value.some(item => matches(row, item))
    const actual = row[key]
    if (value === null || typeof value !== 'object' || value instanceof Date) return actual instanceof Date ? +actual === +value : actual === value
    return Object.entries(value).every(([op, arg]) => {
      if (op === 'in') return arg.includes(actual)
      if (op === 'gte') return +actual >= +arg
      if (op === 'lte') return +actual <= +arg
      if (op === 'lt') return +actual < +arg
      if (op === 'equals') return JSON.stringify(actual) === JSON.stringify(arg)
      if (op === 'isEmpty') return (!actual?.length) === arg
      if (op === 'has') return actual.includes(arg)
      if (op === 'some') return actual.some(item => matches(item, arg))
      return matches(actual, { [op]: arg })
    })
  })
}

function fixture() {
  const grades = Array.from({ length: 5 }, (_, i) => `${i + 1}º Ano Fundamental`)
  const future = new Date(); future.setUTCDate(future.getUTCDate() + 3); future.setUTCHours(12, 0, 0, 0)
  const state = {
    role: 'fund1', authenticated: true, blocks: [], appointments: [], sent: [], errors: [], writes: 0,
    failBlocks: false, failTeachers: false, failCreateAt: 0, failEmail: false,
    teachers: [
      { id: 'ana', name: 'Ana Teste', role: 'fund1' },
      { id: 'bia', name: 'Beatriz Teste', role: 'fund1' },
      { id: 'caio', name: 'Caio Teste', role: 'fund1' },
      { id: 'outro', name: 'Professor Fund. II', role: 'fund2' },
    ].map(teacher => ({ ...teacher, subjects: grades.map(grade => ({ subject: { grade, name: 'Português' } })) })),
    grades, future,
  }
  state.availabilities = state.teachers.map(teacher => ({ id: `avail-${teacher.id}`, teacherId: teacher.id, teacher, active: true, isSpecial: true, specificDate: future, dayOfWeek: future.getUTCDay(), startTime: '13:00', endTime: '14:00' }))
  let createAttempts = 0
  const hydrate = block => ({ ...block, teacher: state.teachers.find(item => item.id === block.teacherId) ?? null })
  const checkBlocks = () => { if (state.failBlocks) throw Object.assign(new Error('missing column'), { code: 'P2022' }) }
  const prisma = {
    teacher: {
      findMany: async ({ where = {} } = {}) => { if (state.failTeachers) throw new Error('teacher failure'); return state.teachers.filter(row => matches(row, where)) },
    },
    teacherSubject: {
      findMany: async ({ where }) => state.teachers.flatMap(teacher => teacher.subjects.filter(item => matches(item, where)).map(item => ({ ...item, teacherId: teacher.id, teacher }))),
    },
    availability: {
      findMany: async ({ where }) => state.availabilities.filter(row => matches(row, where)),
      findUnique: async ({ where }) => state.availabilities.find(row => matches(row, where)) ?? null,
    },
    scheduleBlock: {
      findMany: async ({ where = {} } = {}) => { checkBlocks(); return state.blocks.filter(row => matches(row, where)).map(hydrate) },
      findFirst: async ({ where }) => { checkBlocks(); return state.blocks.filter(row => matches(row, where)).map(hydrate)[0] ?? null },
      findUnique: async ({ where }) => state.blocks.filter(row => matches(row, where)).map(hydrate)[0] ?? null,
      create: async ({ data }) => {
        checkBlocks(); createAttempts++
        if (createAttempts === state.failCreateAt) throw new Error('injected failure')
        const block = { ...data, id: `block-${createAttempts}`, createdAt: new Date() }
        state.blocks.push(block); state.writes++; return hydrate(block)
      },
      delete: async ({ where }) => { state.blocks = state.blocks.filter(row => !matches(row, where)); state.writes++; return {} },
    },
    appointment: {
      findMany: async ({ where }) => state.appointments.filter(row => matches(row, where)),
      findFirst: async ({ where }) => state.appointments.find(row => matches(row, where)) ?? null,
      updateMany: async ({ where, data }) => {
        const selected = state.appointments.filter(row => matches(row, where))
        selected.forEach(row => Object.assign(row, data)); state.writes++; return { count: selected.length }
      },
      create: async ({ data }) => { const row = { ...data, id: `appointment-${state.appointments.length}`, availability: state.availabilities.find(item => item.id === data.availabilityId) }; state.appointments.push(row); return row },
    },
    $transaction: async callback => {
      const beforeBlocks = state.blocks.map(row => ({ ...row }))
      const beforeAppointments = state.appointments.map(row => ({ ...row }))
      const beforeWrites = state.writes
      try { return await callback(prisma) } catch (error) { state.blocks = beforeBlocks; state.appointments = beforeAppointments; state.writes = beforeWrites; throw error }
    },
  }
  const cache = new Map()
  function load(file) {
    file = path.resolve(root, file)
    if (!path.extname(file)) file += '.ts'
    if (cache.has(file)) return cache.get(file).exports
    const module = { exports: {} }; cache.set(file, module)
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText
    function localRequire(id) {
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) }
      if (id === '@/lib/prisma') return { prisma }
      if (id === '@/lib/auth') return { auth: async () => state.authenticated ? { user: { role: state.role } } : null }
      if (id === '@/lib/email') return {
        sendCancellationToParent: async data => { if (state.failEmail) throw new Error('email failure'); state.sent.push(data); return true },
        sendConfirmationToParent: async () => true, sendNotificationToTeacher: async () => true,
      }
      if (id.startsWith('@/')) return load(id.slice(2))
      if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id))
      return require(id)
    }
    vm.runInThisContext(`(function(require,module,exports,console){${js}\n})`, { filename: file })(localRequire, module, module.exports, { ...console, error: (...args) => state.errors.push(args) })
    return module.exports
  }
  const routes = { blocks: load('app/api/bloqueios/route.ts'), options: load('app/api/bloqueios/opcoes/route.ts'), availability: load('app/api/disponibilidade/route.ts'), bookings: load('app/api/agendamentos/route.ts') }
  const addAppointment = (id, teacherId, grade, extra = {}) => {
    const availability = state.availabilities.find(item => item.teacherId === teacherId)
    state.appointments.push({ id, availabilityId: availability.id, availability, date: future, startTime: '13:00', endTime: '13:20', studentGrade: grade, studentName: id, parentName: 'Responsável teste', parentEmail: 'teste@example.invalid', parentPhone: '000', reason: 'Teste', subjectName: 'Português', status: 'confirmed', ...extra })
  }
  return { state, routes, addAppointment, load }
}
module.exports = { fixture, matches }
