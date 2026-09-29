# Atualização — cobrança configurável da recuperação

## O que foi corrigido

`normal` e `paralela` continuam identificando o tipo pedagógico da recuperação,
mas não definem mais se ela é gratuita. Cada slot agora possui:

- `isFree`: indica se é gratuita;
- `priceCents`: valor por disciplina em centavos.

Assim, uma recuperação paralela do 6º ano pode ser paga, enquanto a recuperação
do Fundamental I permanece gratuita por padrão.

## Atualização segura do banco

A migration `20260929120000_recovery_pricing` apenas adiciona duas colunas e
preenche os registros atuais. A migration seguinte (`20260929123000_recovery_price_default_30`)
corrige o antigo padrão de R$40,00 para R$30,00 somente nos slots pagos que ainda
estão exatamente com R$40,00; outros valores personalizados são preservados.
Nenhuma delas remove slots, inscrições, comprovantes ou agendamentos:

- Educação Infantil até o 5º ano: gratuita (`R$ 0,00`);
- 6º ano em diante: paga, com valor inicial de `R$ 30,00` por disciplina.

Depois de substituir os arquivos, no projeto principal:

```powershell
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npm test
npm run build
```

O `migrate deploy` aplica somente migrations ainda não registradas na tabela do
Prisma. Não use `prisma migrate reset` nem `prisma db push` em produção.

## Uso pela coordenação

No cadastro de slots, a cobrança aparece por série selecionada. A coordenação
pode marcar `Gratuita` ou `Paga` e informar o valor por disciplina. A mesma
configuração também pode ser corrigida no botão de editar um slot já criado.

Na tela dos pais, o pagamento e o comprovante aparecem somente quando o slot
selecionado estiver marcado como pago. O tipo `Paralela` nunca mais transforma,
sozinho, o slot em gratuito. O total é recalculado pela quantidade de disciplinas
pagas selecionadas: 1 = R$30,00, 2 = R$60,00, 3 = R$90,00 (ou a soma dos valores
personalizados de cada horário). O comprovante fica na aba `Comprovantes PIX`
da coordenação, onde pode ser visualizado, aprovado ou reprovado.

O limite de disciplinas também é configurável. A secretaria precisa informar o
limite ao criar a recuperação; a tela dos pais só mostra “Selecione até X
disciplinas” depois que essa configuração veio do horário. Não existe mais um
limite visual automático de 5 para novas recuperações. Registros antigos que já
possuem limite continuam com o valor gravado até serem editados.
