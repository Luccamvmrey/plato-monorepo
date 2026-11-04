import { useAppMutation } from "@/core/hooks/useAppMutation";
import { SessionSetService } from "@/features/workouts/services/workout-session/session-set.service.ts";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import type { EnrichedExerciseRecord, SessionSetPayload } from "@/features/workouts/workout.types";

export const useSessionSet = () => {
    const addPendingSet = useActiveWorkoutStore((s) => s.addPendingSet);

    const startRest = useActiveWorkoutStore((s) => s.startRest);

    const confirmSet = (set: SessionSetPayload, record: EnrichedExerciseRecord) => {
        // Fecha o teclado: quem acabou uma série vai descansar, não digitar a próxima,
        // e a barra do timer fica escondida enquanto o teclado está aberto.
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

        addPendingSet(set);

        // Dentro de um bi-set emenda-se direto no próximo exercício: só descansa ao
        // fechar a rodada, depois do último membro do grupo.
        if (!record.group || record.group.isLast) startRest();
    };

    const updateSessionSetMutation = useAppMutation({
        mutationFn: SessionSetService.update,
        invalidateQueries: [["activeSession"]]
    });

    return {
        confirmSet,
        updateSessionSetMutation,
    }
}
