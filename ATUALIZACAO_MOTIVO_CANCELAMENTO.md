# Motivo opcional no cancelamento de plantão — 23/09/2026

Este patch deve ser aplicado sobre a última versão entregue, com o modal de
bloqueios e seleção múltipla de professores/séries. Preserva essas funcionalidades.
Ele contém apenas arquivos alterados/novos, nos caminhos corretos do projeto.

## Comportamento

Em Secretaria > Agendamentos, clique em Cancelar no cartão do plantão:

1. O modal identifica aluno, série, professor, data/horário e responsável.
2. Digite o Motivo do cancelamento (opcional, até 500 caracteres).
3. Confira o e-mail que receberá o aviso e clique em Confirmar cancelamento.
4. O plantão é cancelado, o motivo é salvo e incluído no e-mail.
5. O resultado informa se o serviço de e-mail aceitou o aviso. Se o envio falhar,
   o cancelamento continua salvo e a tela orienta contato pelo telefone cadastrado.
6. Clique em Concluir. O cartão cancelado mostra o motivo para consulta posterior.

Deixar o campo vazio mantém o aviso padrão de cancelamento. O motivo informado
pelo responsável ao agendar é preservado, separado do motivo do cancelamento.

Exemplo: “A professora selecionada não atende a turma da sua filha. Por favor,
faça um novo agendamento com a professora da turma.”

O envio não confirma entrega na caixa de entrada nem leitura pelo responsável.
Este patch utiliza o e-mail já configurado no sistema; não envia WhatsApp
automaticamente. Não houve cancelamento nem envio a responsáveis reais nos testes.

Cancelamentos antigos sem motivo aparecem como “Não informado”. Não há alteração
retroativa nem reenvio automático de avisos. Novos cancelamentos por bloqueio de
período também guardam o motivo do bloqueio no agendamento.

## 1. Substituir os arquivos

Guarde um backup do código atual. Extraia o ZIP numa pasta separada e copie o
conteúdo para C:\dev\agendamentoPedagogico, mesclando as pastas e substituindo
arquivos de mesmo caminho. Não apague pastas inteiras: preserve as migrações antigas.
Preserve o .env. Não copie o schema para generated: o caminho é prisma/schema.prisma.

Execute cada comando separadamente e pare se algum falhar:

```powershell
cd C:\dev\agendamentoPedagogico
npm install
npm test
npm run build
```

O pacote não adiciona dependências. Atualiza o comando npm test para incluir os
novos testes; não altera o package-lock.json da última versão.

## 2. Aplicar a migração ANTES do push/deploy

O git push e o build atual NÃO aplicam as migrações do banco.

Confirme que DATABASE_URL e DIRECT_URL apontam para o mesmo banco/branch Neon
usado pela Vercel em Production e mantenha um backup do banco. Não publique senhas.

```powershell
npx prisma migrate status
```

A única migração nova deste pacote é:

20260923120000_appointment_cancellation_reason

Se ela for a única pendente, execute:

```powershell
npx prisma migrate deploy
```

Ela contém somente:

```sql
ALTER TABLE "Appointment" ADD COLUMN "cancellationReason" TEXT;
```

Isso adiciona um campo opcional: NÃO exclui tabelas, NÃO apaga agendamentos e NÃO
cancela plantões existentes. Os registros antigos continuam com o campo vazio.
A coluna adicional é compatível com a versão anterior do site enquanto o deploy
novo não termina.

Confira novamente:

```powershell
npx prisma migrate status
```

O resultado deve informar Database schema is up to date! Se já estiver atualizado,
não é necessário migrar de novo. Se houver outras migrações pendentes, falhas ou
uma conexão diferente da produção, confira a saída antes de continuar.
Não use migrate reset, migrate dev ou db push em produção.

## 3. Publicar no Git/Vercel

```powershell
git branch --show-current
git status --short
```

Se a branch for main e os passos anteriores terminaram sem erro:

```powershell
git add -- app/secretaria/page.tsx 'app/api/agendamentos/[id]/route.ts' app/api/bloqueios/route.ts
git add -- components/secretaria/AgendamentoCard.tsx components/secretaria/CancelAppointmentModal.tsx components/secretaria/CancelAppointmentModal.module.css
git add -- lib/email.ts types/index.ts prisma/schema.prisma prisma/migrations/20260923120000_appointment_cancellation_reason/migration.sql
git add -- package.json tests/block-api-fixture.cjs tests/cancellation-api.test.cjs tests/cancellation-ui.test.cjs ATUALIZACAO_MOTIVO_CANCELAMENTO.md
git --no-pager diff --cached --stat
```

Confira que a lista contém apenas as alterações esperadas, sem .env ou senhas.
Então:

```powershell
git commit -m "adicionar motivo opcional ao cancelar plantao"
git push origin main
```

Aguarde Ready / Production na Vercel. Recarregue com Ctrl + F5. Abra Cancelar em
um cartão e confira o modal; Voltar fecha sem cancelar. Confirme somente quando
quiser efetivamente cancelar aquele plantão, pois isso notifica o responsável.

## Arquivos do patch

- app/secretaria/page.tsx
- app/api/agendamentos/[id]/route.ts
- app/api/bloqueios/route.ts
- components/secretaria/AgendamentoCard.tsx
- components/secretaria/CancelAppointmentModal.tsx
- components/secretaria/CancelAppointmentModal.module.css
- lib/email.ts
- types/index.ts
- prisma/schema.prisma
- prisma/migrations/20260923120000_appointment_cancellation_reason/migration.sql
- package.json
- tests/block-api-fixture.cjs
- tests/cancellation-api.test.cjs
- tests/cancellation-ui.test.cjs
- ATUALIZACAO_MOTIVO_CANCELAMENTO.md

## Validação e limites

67 verificações automatizadas: 45 anteriores de bloqueios + 14 novos testes de
API/e-mail + 8 novos testes de interface. Incluem motivo ausente/vazio/preenchido,
limite de texto, sessão/permissão, cliques concorrentes, preservação do motivo
original, envio aguardado, falha de banco e e-mail, HTML escapado e cartão cancelado.

TypeScript, schema Prisma e build de produção validados. A comparação entre o
schema anterior e o atual gerou apenas a adição de cancellationReason.

Banco e transporte de e-mail foram simulados. Os testes usam os handlers reais;
as interações React foram executadas em JSDOM. O navegador disponível bloqueou
o acesso ao servidor local, então não houve teste visual em navegador real.
Não foi acessado o banco real, executada a migração em produção ou enviado e-mail
real. A confirmação de funcionamento no seu ambiente depende da aplicação da
migração e das configurações existentes de e-mail.
