-- AlterTable ExamSchedule: adicionar registrationDeadline (prazo de inscrições)
ALTER TABLE "ExamSchedule" ADD COLUMN "registrationDeadline" TIMESTAMP;

-- AlterTable ExamBooking: adicionar subjects (CSV de disciplinas selecionadas)
-- e autorizacaoText (novo tipo de justificação)
ALTER TABLE "ExamBooking" ADD COLUMN "subjects" TEXT DEFAULT '';
ALTER TABLE "ExamBooking" ADD COLUMN "autorizacaoText" TEXT;

