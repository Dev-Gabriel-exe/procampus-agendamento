// ============================================================
// ARQUIVO: prisma/seed.ts
// CAMINHO: procampus-agendamento/prisma/seed.ts
// ============================================================

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('procampus2025', 12)

  await prisma.secretary.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hashedPassword },
  })
  console.log('✅ Admin criado: admin / procampus2025')

  const disciplinas = [
   // -----------------------------------------------------------------
  // 1º Ano Fundamental
  // -----------------------------------------------------------------
  { name: 'Português', grade: '1º Ano Fundamental' },
  { name: 'Matemática', grade: '1º Ano Fundamental' },
  { name: 'História', grade: '1º Ano Fundamental' },
  { name: 'Geografia', grade: '1º Ano Fundamental' },
  { name: 'Ciências', grade: '1º Ano Fundamental' },
  { name: 'Inglês', grade: '1º Ano Fundamental' },
  { name: 'Artes', grade: '1º Ano Fundamental' },
  { name: 'Educação Física', grade: '1º Ano Fundamental' },

  // -----------------------------------------------------------------
  // 2º Ano Fundamental
  // -----------------------------------------------------------------
  { name: 'Português', grade: '2º Ano Fundamental' },
  { name: 'Matemática', grade: '2º Ano Fundamental' },
  { name: 'História', grade: '2º Ano Fundamental' },
  { name: 'Geografia', grade: '2º Ano Fundamental' },
  { name: 'Ciências', grade: '2º Ano Fundamental' },
  { name: 'Inglês', grade: '2º Ano Fundamental' },
  { name: 'Artes', grade: '2º Ano Fundamental' },
  { name: 'Educação Física', grade: '2º Ano Fundamental' },

  // -----------------------------------------------------------------
  // 3º Ano Fundamental
  // -----------------------------------------------------------------
  { name: 'Português', grade: '3º Ano Fundamental' },
  { name: 'Matemática', grade: '3º Ano Fundamental' },
  { name: 'História', grade: '3º Ano Fundamental' },
  { name: 'Geografia', grade: '3º Ano Fundamental' },
  { name: 'Ciências', grade: '3º Ano Fundamental' },
  { name: 'Inglês', grade: '3º Ano Fundamental' },
  { name: 'Artes', grade: '3º Ano Fundamental' },
  { name: 'Educação Física', grade: '3º Ano Fundamental' },

  // -----------------------------------------------------------------
  // 4º Ano Fundamental
  // -----------------------------------------------------------------
  { name: 'Português', grade: '4º Ano Fundamental' },
  { name: 'Matemática', grade: '4º Ano Fundamental' },
  { name: 'História', grade: '4º Ano Fundamental' },
  { name: 'Geografia', grade: '4º Ano Fundamental' },
  { name: 'Ciências', grade: '4º Ano Fundamental' },
  { name: 'Inglês', grade: '4º Ano Fundamental' },
  { name: 'Artes', grade: '4º Ano Fundamental' },
  { name: 'Educação Física', grade: '4º Ano Fundamental' },
  { name: 'Programação', grade: '4º Ano Fundamental' },

  // -----------------------------------------------------------------
  // 5º Ano Fundamental
  // -----------------------------------------------------------------
  { name: 'Português', grade: '5º Ano Fundamental' },
  { name: 'Matemática', grade: '5º Ano Fundamental' },
  { name: 'História', grade: '5º Ano Fundamental' },
  { name: 'Geografia', grade: '5º Ano Fundamental' },
  { name: 'Ciências', grade: '5º Ano Fundamental' },
  { name: 'Inglês', grade: '5º Ano Fundamental' },
  { name: 'Artes', grade: '5º Ano Fundamental' },
  { name: 'Educação Física', grade: '5º Ano Fundamental' },
  { name: 'Programação', grade: '5º Ano Fundamental' },

  // -----------------------------------------------------------------
  // 6º Ano Fundamental
  // -----------------------------------------------------------------
  { name: 'Português', grade: '6º Ano Fundamental' },
  { name: 'Matemática', grade: '6º Ano Fundamental' },
  { name: 'História', grade: '6º Ano Fundamental' },
  { name: 'Geografia', grade: '6º Ano Fundamental' },
  { name: 'Ciências', grade: '6º Ano Fundamental' },
  { name: 'Inglês', grade: '6º Ano Fundamental' },
  { name: 'Artes', grade: '6º Ano Fundamental' },
  { name: 'Educação Física', grade: '6º Ano Fundamental' },
  { name: 'Programação', grade: '6º Ano Fundamental' },

  // -----------------------------------------------------------------
  // 7º Ano Fundamental
  // -----------------------------------------------------------------
  { name: 'Português', grade: '7º Ano Fundamental' },
  { name: 'Matemática', grade: '7º Ano Fundamental' },
  { name: 'História', grade: '7º Ano Fundamental' },
  { name: 'Geografia', grade: '7º Ano Fundamental' },
  { name: 'Ciências', grade: '7º Ano Fundamental' },
  { name: 'Inglês', grade: '7º Ano Fundamental' },
  { name: 'Artes', grade: '7º Ano Fundamental' },
  { name: 'Educação Física', grade: '7º Ano Fundamental' },
  { name: 'Programação', grade: '7º Ano Fundamental' },
  // -----------------------------------------------------------------
  // 8º Ano Fundamental
  // -----------------------------------------------------------------
  { name: 'Português', grade: '8º Ano Fundamental' },
  { name: 'Matemática', grade: '8º Ano Fundamental' },
  { name: 'História', grade: '8º Ano Fundamental' },
  { name: 'Geografia', grade: '8º Ano Fundamental' },
  { name: 'Ciências', grade: '8º Ano Fundamental' },
  { name: 'Inglês', grade: '8º Ano Fundamental' },
  { name: 'Artes', grade: '8º Ano Fundamental' },
  { name: 'Educação Física', grade: '8º Ano Fundamental' },
  { name: 'Programação', grade: '8º Ano Fundamental' },
  // -----------------------------------------------------------------
  // 9º Ano Fundamental
  // -----------------------------------------------------------------
  { name: 'Português', grade: '9º Ano Fundamental' },
  { name: 'Matemática', grade: '9º Ano Fundamental' },
  { name: 'História', grade: '9º Ano Fundamental' },
  { name: 'Geografia', grade: '9º Ano Fundamental' },
  { name: 'Ciências', grade: '9º Ano Fundamental' },
  { name: 'Inglês', grade: '9º Ano Fundamental' },
  { name: 'Artes', grade: '9º Ano Fundamental' },
  { name: 'Educação Física', grade: '9º Ano Fundamental' },
  { name: 'Física', grade: '9º Ano Fundamental' },
  { name: 'Química', grade: '9º Ano Fundamental' },
  { name: 'Programação', grade: '9º Ano Fundamental' },
  // -----------------------------------------------------------------
  // 1ª Série do Ensino Médio
  // -----------------------------------------------------------------
  { name: 'Português', grade: '1ª Série Médio' },
  { name: 'Matemática', grade: '1ª Série Médio' },
  { name: 'História', grade: '1ª Série Médio' },
  { name: 'Geografia', grade: '1ª Série Médio' },
  { name: 'Biologia', grade: '1ª Série Médio' },
  { name: 'Física', grade: '1ª Série Médio' },
  { name: 'Química', grade: '1ª Série Médio' },
  { name: 'Inglês', grade: '1ª Série Médio' },
  { name: 'Artes', grade: '1ª Série Médio' },
  { name: 'Educação Física', grade: '1ª Série Médio' },
  { name: 'Filosofia', grade: '1ª Série Médio' },
  { name: 'Sociologia', grade: '1ª Série Médio' },

  // -----------------------------------------------------------------
  // 2ª Série do Ensino Médio
  // -----------------------------------------------------------------
  { name: 'Português', grade: '2ª Série Médio' },
  { name: 'Matemática', grade: '2ª Série Médio' },
  { name: 'História', grade: '2ª Série Médio' },
  { name: 'Geografia', grade: '2ª Série Médio' },
  { name: 'Biologia', grade: '2ª Série Médio' },
  { name: 'Física', grade: '2ª Série Médio' },
  { name: 'Química', grade: '2ª Série Médio' },
  { name: 'Inglês', grade: '2ª Série Médio' },
  { name: 'Artes', grade: '2ª Série Médio' },
  { name: 'Educação Física', grade: '2ª Série Médio' },
  { name: 'Filosofia', grade: '2ª Série Médio' },
  { name: 'Sociologia', grade: '2ª Série Médio' },

  // -----------------------------------------------------------------
  // 3ª Série do Ensino Médio
  // -----------------------------------------------------------------
  { name: 'Português', grade: '3ª Série Médio' },
  { name: 'Matemática', grade: '3ª Série Médio' },
  { name: 'História', grade: '3ª Série Médio' },
  { name: 'Geografia', grade: '3ª Série Médio' },
  { name: 'Biologia', grade: '3ª Série Médio' },
  { name: 'Física', grade: '3ª Série Médio' },
  { name: 'Química', grade: '3ª Série Médio' },
  { name: 'Inglês', grade: '3ª Série Médio' },
  { name: 'Artes', grade: '3ª Série Médio' },
  { name: 'Educação Física', grade: '3ª Série Médio' },
  { name: 'Filosofia', grade: '3ª Série Médio' },
  { name: 'Sociologia', grade: '3ª Série Médio' },
  ]

  for (const d of disciplinas) {
    const id = `${d.name}-${d.grade}`.toLowerCase().replace(/[\s\/]/g, '-')
    await prisma.subject.upsert({
      where: { id },
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