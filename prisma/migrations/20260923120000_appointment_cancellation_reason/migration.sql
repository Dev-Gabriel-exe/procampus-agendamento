-- Motivo opcional do cancelamento. Registros existentes permanecem intactos.
ALTER TABLE "Appointment" ADD COLUMN "cancellationReason" TEXT;
