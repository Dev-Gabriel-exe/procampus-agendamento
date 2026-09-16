-- Permite limitar um bloqueio a séries específicas.
-- Lista vazia representa "todas as séries", preservando o comportamento
-- de todos os bloqueios que já existem. Nenhum dado é removido.

ALTER TABLE "ScheduleBlock"
ADD COLUMN "grades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
