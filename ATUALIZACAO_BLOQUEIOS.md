# Atualização — bloqueio de agendamentos

## O que foi adicionado

- Bloqueio de uma data ou de um período completo.
- Bloqueio para todos os professores ou para um professor específico.
- Quantidade ilimitada de bloqueios futuros.
- Motivo visível para os pais na tela de escolha dos horários.
- Horários bloqueados deixam de aparecer para os pais.
- Validação também no servidor para impedir agendamento por tela antiga.
- Agendamentos futuros existentes são cancelados, preservados no histórico e os pais recebem e-mail com o motivo.
- Ao desbloquear, os horários livres voltam; agendamentos que foram cancelados não são restaurados.

## Como atualizar com segurança

O ZIP não contém `.env`, `node_modules` nem `.next`.

1. Extraia o ZIP em uma pasta nova.
2. Copie apenas o seu `.env` atual para essa pasta nova. Não envie o `.env` ao GitHub.
3. Instale as dependências:

```powershell
npm install
```

4. Confira o banco correto:

```powershell
npx prisma migrate status
```

O esperado é aparecer somente esta migration como pendente:

```text
20260915120000_schedule_blocks
```

5. Compare o banco sem alterá-lo:

```powershell
npx prisma migrate diff --from-schema-datasource .\prisma\schema.prisma --to-schema-datamodel .\prisma\schema.prisma --script
```

O esperado é a criação da tabela `ScheduleBlock`, seus dois índices e a chave estrangeira para `Teacher`. Não deve aparecer `DROP TABLE`.

6. Aplique a migration:

```powershell
npx prisma migrate deploy
```

7. Execute os testes e a compilação:

```powershell
npm test
npm run build
```

8. Faça o deploy normalmente.

Não atualize o Prisma para a versão 8 nesta atualização.
