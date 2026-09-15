# Atualização das regras de provas

## O que mudou

- Segunda chamada: a secretaria define, ao criar o lote, se a prova exige contraturno.
- Recuperação: somente disciplinas com horários abertos aparecem para o aluno.
- Recuperação: a secretaria define o máximo de disciplinas por aluno.
- O limite e as disciplinas também são validados pela API.
- Recuperação normal e paralela foram alinhadas entre tela, API e e-mail.
- As rotas de edição agora exigem autenticação.
- A edição de recuperação volta a atualizar a tabela correta.

## Compatibilidade com dados existentes

A migration preserva o comportamento anterior:

- slots antigos do Fundamental I ficam com contraturno habilitado;
- slots antigos das outras séries ficam sem contraturno;
- recuperações antigas do Fundamental I recebem limite 2;
- recuperações antigas das outras séries recebem limite 5.

## Publicação

Faça backup do banco antes da migration. Depois, no ambiente que possui `DATABASE_URL` e `DIRECT_URL`, execute:

```bash
npm ci
npx prisma migrate deploy
npm run build
```

Em seguida, publique normalmente na plataforma em que o projeto já está hospedado.

## Validação realizada

O projeto foi validado com `prisma generate` e `next build`, incluindo a checagem de tipos do TypeScript.
