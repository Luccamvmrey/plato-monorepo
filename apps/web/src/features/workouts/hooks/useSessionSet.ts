import { useAppMutation } from "@/core/hooks/useAppMutation";
import { SessionSetService } from "@/features/workouts/services/workout-session/session-set.service.ts";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import type { SessionSetPayload } from "@/features/workouts/workout.types";

export const useSessionSet = () => {
    const addPendingSet = useActiveWorkoutStore((s) => s.addPendingSet);

    const confirmSet = (set: SessionSetPayload) => {
        addPendingSet(set);
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
