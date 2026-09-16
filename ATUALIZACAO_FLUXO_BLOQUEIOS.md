# Bloqueios: seleção múltipla e carregamento corrigido

Este patch substitui o fluxo de bloqueio de plantões. Não altera as regras de provas.
É cumulativo sobre a versão de bloqueios por série e inclui os arquivos necessários
do modal, inclusive a página da secretaria que posiciona seu botão.

## Como ficou

1. Abra Agendamentos > Bloquear datas > Novo bloqueio.
2. Informe data inicial e final (iguais para um único dia).
3. Marque uma ou várias séries. A lista aparece independentemente dos professores.
4. Escolha todos os professores ou Selecionar professores. Nesse segundo modo,
   use as caixas de seleção, a busca por nome, Marcar exibidos e Limpar professores.
5. Informe o motivo e clique em Revisar bloqueio. Confira séries, nomes e datas.
6. Confirme. Apenas agendamentos futuros do período, professores e séries escolhidos
   serão cancelados. O sistema informa quantos e-mails conseguiu enviar.

Exemplo: todas as professoras + 2º, 3º, 4º e 5º anos. O 1º ano não é afetado por esse
bloqueio. Se houver outro bloqueio para todas as séries no mesmo período, ele também
precisa ser removido para liberar o 1º ano.

Vários professores são salvos em uma única transação, com um registro por professor.
Isso permite desbloquear um professor sem liberar os demais. Não há nova migração
para a seleção múltipla.

## Antes de substituir

- Guarde um backup do código atual ou um commit, sem incluir senhas.
- Confirme que você está na pasta C:\dev\agendamentoPedagogico.
- Extraia este ZIP primeiro em uma pasta separada. Copie seu conteúdo para a raiz
  do projeto, mesclando as pastas e substituindo os arquivos de mesmo caminho.
- NÃO apague pastas inteiras do projeto. Preserve as migrações antigas.
- O arquivo prisma/schema.prisma vai na pasta prisma, nunca em generated.
- Suas variáveis de ambiente não estão neste pacote e não devem ser apagadas.

## Banco

Nenhuma nova migração foi criada nesta correção. Incluímos novamente a migração
20260916120000_schedule_block_grades para quem ainda não a aplicou. Ela permanece
inalterada: adiciona grades à ScheduleBlock e não remove informações.

Execute na raiz do projeto, um comando por vez, e pare se aparecer erro:

```powershell
npm install
npm test
npm run build
npx prisma migrate status
```

Se o status disser que está atualizado, não é preciso migrar novamente. Se a única
migração pendente for 20260916120000_schedule_block_grades, faça backup do banco e
confirme que o host é o Neon deste projeto antes de executar:

```powershell
npx prisma migrate deploy
```

Se houver outras migrações pendentes, pare e confira a conexão/histórico antes de
publicar. Não use migrate reset, migrate dev ou db push em produção.

## Publicação

Confirme primeiro:

```powershell
git branch --show-current
git status --short
```

A branch de produção deste projeto é main. Se aparecer outra, não faça push para
main sem integrar as alterações. Estando na main, revise os arquivos e use:

```powershell
git add app/secretaria/page.tsx app/agendamento/page.tsx app/api/bloqueios/route.ts app/api/bloqueios/opcoes/route.ts app/api/disponibilidade/route.ts app/api/agendamentos/route.ts components/secretaria/ScheduleBlocksPanel.tsx components/secretaria/ScheduleBlocksPanel.module.css lib/block-selection.ts lib/schedule-blocks.ts lib/roles.ts types/index.ts prisma/schema.prisma prisma/migrations/20260916120000_schedule_block_grades/migration.sql package.json package-lock.json tests/schedule-blocks.test.ts tests/tsconfig.json tests/block-api-fixture.cjs tests/block-api.test.cjs tests/block-ui.test.cjs ATUALIZACAO_FLUXO_BLOQUEIOS.md
git diff --cached --stat
git commit -m "corrigir fluxo e selecao multipla dos bloqueios"
git push origin main
```

Aguarde Ready em Production na Vercel e recarregue o site.

## Testes realizados e limites

- 17 verificações das regras de datas, professores e séries.
- 21 testes dos handlers reais de API com banco/e-mail simulados.
- 7 testes do componente React com eventos de clique/preenchimento em JSDOM.
- Schema Prisma validado e build de produção verificado.

Cobertura: carregamento independente, falhas/retry, sessão e permissões, múltiplos
professores/séries, revisão e confirmação, busca, seleções vazias, duplicidades,
cancelamento seletivo, reversão do lote em falha simulada, aviso de e-mail não
enviado, horários do responsável e revalidação de tela antiga.

O banco e o e-mail reais da escola NÃO foram acessados. O navegador disponibilizado
neste ambiente bloqueou o servidor local, então não houve validação visual em um
navegador real. JSDOM testa os eventos/estados, não pixels nem o foco nativo do dialog.

Depois do deploy, confira primeiro a lista de séries e professores, marque dois de
cada e vá até Revisar bloqueio, sem confirmar em produção só para testar. Criar um
bloqueio real pode cancelar agendamentos, e removê-lo não os restaura.
