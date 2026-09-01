-- Regras configuráveis da segunda chamada e recuperação.
-- Os valores iniciais preservam o comportamento que já estava em produção.

ALTER TABLE "ExamSchedule"
ADD COLUMN "oppositeShift" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ExamSchedule"
SET "oppositeShift" = true
WHERE "grade" IN (
  'Educação Infantil',
  '1º Ano Fundamental',
  '2º Ano Fundamental',
  '3º Ano Fundamental',
  '4º Ano Fundamental',
  '5º Ano Fundamental'
);

ALTER TABLE "RecoverySchedule"
ADD COLUMN "maxSubjects" INTEGER NOT NULL DEFAULT 5;

UPDATE "RecoverySchedule"
SET "maxSubjects" = 2
WHERE "grade" IN (
  'Educação Infantil',
  '1º Ano Fundamental',
  '2º Ano Fundamental',
  '3º Ano Fundamental',
  '4º Ano Fundamental',
  '5º Ano Fundamental'
);
