import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 12)

  // ── 3 logins de secretaria ──────────────────────────────
  await prisma.secretary.upsert({
    where:  { username: 'admin' },
    update: {},
    create: { username: 'admin', password: await hash('procampus2025'), role: 'geral' },
  })
  await prisma.secretary.upsert({
    where:  { username: 'fund1' },
    update: {},
    create: { username: 'fund1', password: await hash('fund1_2025'), role: 'fund1' },
  })
  await prisma.secretary.upsert({
    where:  { username: 'fund2' },
    update: {},
    create: { username: 'fund2', password: await hash('fund2_2025'), role: 'fund2' },
  })

  console.log('✅ Secretarias criadas:')
  console.log('   admin / procampus2025  → acesso geral')
  console.log('   fund1 / fund1_2025     → Educação Infantil + 1º ao 5º ano')
  console.log('   fund2 / fund2_2025     → 6º ao 9º ano + Ensino Médio')

  // ── Disciplinas ─────────────────────────────────────────
  const disciplinas = [
    // Fund I
    ...(['1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental','4º Ano Fundamental','5º Ano Fundamental'] as const).flatMap(grade => [
      { name: 'Português', grade }, { name: 'Matemática', grade },
      { name: 'História', grade },  { name: 'Geografia', grade },
      { name: 'Ciências', grade },  { name: 'Inglês', grade },
      { name: 'Artes', grade },     { name: 'Educação Física', grade },
      ...(['4º Ano Fundamental','5º Ano Fundamental'].includes(grade) ? [{ name: 'Programação', grade }] : []),
    ]),
    // Fund II
    ...(['6º Ano Fundamental','7º Ano Fundamental','8º Ano Fundamental','9º Ano Fundamental'] as const).flatMap(grade => [
      { name: 'Português', grade }, { name: 'Matemática', grade },
      { name: 'História', grade },  { name: 'Geografia', grade },
      { name: 'Ciências', grade },  { name: 'Inglês', grade },
      { name: 'Artes', grade },     { name: 'Educação Física', grade },
      { name: 'Programação', grade },
      ...(['8º Ano Fundamental','9º Ano Fundamental'].includes(grade) ? [{ name: 'Física', grade }, { name: 'Química', grade }] : []),
    ]),
    // Médio
    ...(['1ª Série Médio','2ª Série Médio','3ª Série Médio'] as const).flatMap(grade => [
      { name: 'Português', grade }, { name: 'Matemática', grade },
      { name: 'História', grade },  { name: 'Geografia', grade },
      { name: 'Biologia', grade },  { name: 'Física', grade },
      { name: 'Química', grade },   { name: 'Inglês', grade },
      { name: 'Artes', grade },     { name: 'Educação Física', grade },
      { name: 'Filosofia', grade }, { name: 'Sociologia', grade },
    ]),
    // Educação Infantil
    ...[
      { name: 'Português', grade: 'Educação Infantil' },
      { name: 'Matemática', grade: 'Educação Infantil' },
      { name: 'Artes', grade: 'Educação Infantil' },
      { name: 'Educação Física', grade: 'Educação Infantil' },
    ],
  ]

  for (const d of disciplinas) {
    const id = `${d.name}-${d.grade}`.toLowerCase().replace(/[\sºªç\/]/g, '-').replace(/-+/g, '-')
    await prisma.subject.upsert({
      where:  { id },
      update: {},
      create: { id, name: d.name, grade: d.grade },
    })
  }

  console.log('✅ Disciplinas criadas!')
  console.log('\n🚀 Seed concluído!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })