import { Repeat2, SkipForward, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";

type ExerciseHeaderInactiveProps = {
    record: EnrichedExerciseRecord;
    onUndoSkip?: () => void;
    isPending?: boolean;
};

/**
 * Exercício que saiu da fila sem ser executado — pulado ou trocado.
 *
 * Continua visível de propósito: sumir da tela apagaria da vista justamente a
 * informação que o snapshot existe para guardar. Mas em uma linha só, e sem repetir o
 * nome do substituto — ele é o card imediatamente abaixo, então a posição já diz.
 */
const ExerciseHeaderInactive = ({ record, onUndoSkip, isPending }: ExerciseHeaderInactiveProps) => {
    const isSkipped = record.status === "SKIPPED";

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/70 bg-card/50">
            {isSkipped
                ? <SkipForward className="size-3.5 text-muted-foreground/70 shrink-0" />
                : <Repeat2 className="size-3.5 text-muted-foreground/70 shrink-0" />}

            <span className="flex-1 min-w-0 truncate text-[13px] text-muted-foreground">
                {record.exercise.name}
            </span>

            <span className="text-[11px] text-muted-foreground/70 shrink-0">
                {isSkipped ? "Pulado" : "Trocado"}
                {record.logs.length > 0 && ` · ${record.logs.length} séries`}
            </span>

            {isSkipped && onUndoSkip && (
                // size-9 + tap-target: a linha é fina, mas o alvo de toque continua
                // com 44px por baixo. `relative` é obrigatório — o ::after do
                // .tap-target se posiciona em relação a este botão.
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Desfazer pulo de ${record.exercise.name}`}
                    className="size-9 -my-1 shrink-0 text-muted-foreground relative tap-target"
                    onClick={onUndoSkip}
                    disabled={isPending}
                >
                    <Undo2 data-icon="inline" className="size-3.5" />
                </Button>
            )}
        </div>
    );
};

export default ExerciseHeaderInactive;
