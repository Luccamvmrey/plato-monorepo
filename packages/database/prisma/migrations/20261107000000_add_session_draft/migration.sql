-- Rascunho da sessão em andamento. Tudo nulável ou com default: sessões existentes não mudam.
ALTER TABLE "WorkoutSession"
    ADD COLUMN "draftSets" JSONB,
    ADD COLUMN "lastSetAt" TIMESTAMP(3),
    ADD COLUMN "autoCompleted" BOOLEAN NOT NULL DEFAULT false;
