# ProCampus Agendamento

Sistema de agendamento de reuniões pedagógicas.

## Estrutura do Projeto

```
procampus-agendamento/
├── prisma/          - Schema e seed do banco de dados
├── public/          - Assets estáticos
├── src/
│   ├── app/         - App router e páginas
│   ├── components/  - Componentes React
│   ├── lib/         - Utilitários e libs
│   ├── types/       - Tipos TypeScript
│   └── middleware.ts - Middleware NextAuth
├── .env.local       - Variáveis de ambiente
└── package.json     - Dependências
```

## Setup

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Configurar `.env.local` com suas variáveis de ambiente

3. Rodar migrações do Prisma:
   ```bash
   npx prisma migrate dev
   ```

4. Rodar seed (criar admin):
   ```bash
   npx prisma db seed
   ```

5. Iniciar dev server:
   ```bash
   npm run dev
   ```

## Páginas

- `/` - Home (pública)
- `/agendamento` - Agendamento (pública, 4 steps)
- `/secretaria` - Dashboard (protegida)
- `/secretaria/login` - Login
- `/secretaria/professores` - CRUD professores
