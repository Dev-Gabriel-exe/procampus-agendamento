-- Calendário de bloqueios para plantões e reuniões pedagógicas.
-- A migration apenas cria a nova tabela; nenhum agendamento existente é removido.

CREATE TABLE "ScheduleBlock" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'geral',
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduleBlock_startDate_endDate_idx" ON "ScheduleBlock"("startDate", "endDate");
CREATE INDEX "ScheduleBlock_teacherId_idx" ON "ScheduleBlock"("teacherId");

ALTER TABLE "ScheduleBlock"
ADD CONSTRAINT "ScheduleBlock_teacherId_fkey"
FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
