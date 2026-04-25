import { SessionSetService } from "@/features/workouts/services/workout-session/session-set.service.ts";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { useQueryClient } from "@tanstack/react-query";
import type { FindActiveSessionResponse } from "../services/workout-session/workout-session.service";

export const useSessionSet = () => {
    const queryClient = useQueryClient();

    const createSessionSetMutation = useAppMutation({
        mutationFn: SessionSetService.create,
        onMutate: async (newSet) => {
            await queryClient.cancelQueries({ queryKey: ["activeSession"] });
            const previousSession = queryClient.getQueryData<FindActiveSessionResponse>(["activeSession"]);

            if (previousSession?.activeSession) {
                queryClient.setQueryData<FindActiveSessionResponse>(["activeSession"], {
                    ...previousSession,
                    activeSession: {
                        ...previousSession.activeSession,
                        sessionSet: [
                            ...previousSession.activeSession.sessionSet,
                            {
                                ...newSet,
                                id: Math.random(), // Temporary ID for rendering
                                actualWeight: newSet.actualWeight,
                                actualReps: newSet.actualReps,
                                equipmentWeight: newSet.equipmentWeight ?? null,
                                rpe: newSet.rpe,
                                setNumber: newSet.setNumber,
                                userObservation: null
                            }
                        ] as any
                    }
                });
            }

            return { previousSession };
        },
        onError: (_err, _newSet, context) => {
            if (context?.previousSession) {
                queryClient.setQueryData(["activeSession"], context.previousSession);
            }
        },
        invalidateQueries: [["activeSession"]]
    });

    const updateSessionSetMutation = useAppMutation({
        mutationFn: SessionSetService.update,
        invalidateQueries: [["activeSession"]]
    });

    return {
        createSessionSetMutation,
        updateSessionSetMutation,
    }
}
