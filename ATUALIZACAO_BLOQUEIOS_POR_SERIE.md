# Atualização: bloqueios por série

O bloqueio de plantões agora pode combinar:

- todos os professores ou um professor específico;
- todas as séries ou séries específicas;
- uma data ou um período;
- motivo exibido aos responsáveis.

Uma seleção como **todos os professores + 2º ao 5º ano** mantém os horários do
1º ano disponíveis. Ao cadastrar o bloqueio, somente agendamentos futuros das
séries e professores selecionados são cancelados.

## Atualização segura

Depois de substituir os arquivos, execute na raiz do projeto:

```powershell
npx prisma migrate status
npx prisma migrate deploy
npm test
npm run build
```

A única migração nova esperada é:

```text
20260916120000_schedule_block_grades
```

Ela somente adiciona a coluna `grades` à tabela `ScheduleBlock`. Não apaga nem
altera agendamentos, professores ou bloqueios existentes. Bloqueios antigos
recebem uma lista vazia, que significa **todas as séries**, preservando o
comportamento anterior.

Se todos os comandos concluírem sem erro:

```powershell
git add .
git commit -m "permitir bloqueios por serie"
git push origin main
```

Não use `prisma migrate dev` nem `prisma db push` no banco de produção.
