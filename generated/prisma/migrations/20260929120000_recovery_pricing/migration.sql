-- A cobrança não deve ser inferida pelo tipo normal/paralela.
-- Adiciona apenas colunas e preserva todas as inscrições existentes.

ALTER TABLE "RecoverySchedule"
ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "priceCents" INTEGER NOT NULL DEFAULT 4000;

-- Regra atual da escola: Fundamental I é gratuito; Fundamental II e Médio são pagos.
UPDATE "RecoverySchedule"
SET "isFree" = true,
    "priceCents" = 0
WHERE "grade" IN (
  'Educação Infantil',
  '1º Ano Fundamental',
  '2º Ano Fundamental',
  '3º Ano Fundamental',
  '4º Ano Fundamental',
  '5º Ano Fundamental'
);
