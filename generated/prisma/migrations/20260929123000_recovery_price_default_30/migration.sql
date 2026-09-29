-- Corrige o valor padrão usado pela migration de cobrança anterior.
-- Só altera registros pagos que ainda estão exatamente no antigo padrão de R$ 40,00;
-- valores personalizados diferentes de R$ 40,00 são preservados.

UPDATE "RecoverySchedule"
SET "priceCents" = 3000
WHERE "isFree" = false
  AND "priceCents" = 4000;

ALTER TABLE "RecoverySchedule"
ALTER COLUMN "priceCents" SET DEFAULT 3000;
