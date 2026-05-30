import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { WorkoutSessionService } from "../services/workout-session/workout-session.service";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { path } from "@/core/constants/path.ts";

export const useActiveSession = () => {
    const [, navigate] = useLocation();
    const token = useAuthStore((state) => state.token);

    const findActiveSessionQuery = useQuery({
        queryKey: ["activeSession"],
        queryFn: () => WorkoutSessionService.findActiveSession(),
        enabled: !!token,
    });

    const createSessionMutation = useAppMutation({
        mutationFn: WorkoutSessionService.create,
        invalidateQueries: [["sessions"], ["activeSession"]],
        suppressDefaultError: true,
        onSuccess: (data) => {
            const { newSession } = data;
            navigate(path.ACTIVE_WORKOUT + `/${newSession.workoutId}`);
        },
    });

    return { findActiveSessionQuery, createSessionMutation };
};
