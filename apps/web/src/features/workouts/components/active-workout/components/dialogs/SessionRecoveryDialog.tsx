import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service.ts";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store.ts";
import { useAppMutation } from "@/core/hooks/useAppMutation.ts";
import { path } from "@/core/constants/path.ts";
import { formatDurationExtensive } from "@/core/utils/time.ts";

export const SessionRecoveryDialog = () => {
    const token = useAuthStore((s) => s.token);
    const isAuthenticated = !!token;
    const [location, navigate] = useLocation();
    const [dismissed, setDismissed] = useState(false);
    const clearState = useActiveWorkoutStore((s) => s.clearState);

    const { data, isSuccess } = useQuery({
        queryKey: ["activeSession"],
        queryFn: () => WorkoutSessionService.findActiveSession(),
        enabled: isAuthenticated,
    });

    const deleteMutation = useAppMutation({
        mutationFn: WorkoutSessionService.delete,
        invalidateQueries: [["activeSession"]],
    });

    const session = data?.activeSession ?? null;
    const isOnActivePage = location.startsWith(path.ACTIVE_WORKOUT);
    const showDialog = isAuthenticated && isSuccess && !!session && !isOnActivePage && !dismissed;

    const elapsedSeconds = session
        ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        : 0;
    const workoutName = session?.workout?.name ?? "Treino";

    const handleContinue = () => {
        navigate(`${path.ACTIVE_WORKOUT}/${session!.workoutId}`);
    };

    const handleDiscard = () => {
        clearState();
        deleteMutation.mutate(session!.id);
    };

    return (
        <AlertDialog open={showDialog} onOpenChange={(open) => !open && setDismissed(true)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sessão interrompida</AlertDialogTitle>
                    <AlertDialogDescription>
                        Você tem uma sessão de <strong>{workoutName}</strong> iniciada há{" "}
                        {formatDurationExtensive(elapsedSeconds)} que não foi finalizada.
                        Deseja continuar de onde parou ou descartar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleDiscard}>
                        Descartar
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleContinue}>
                        Continuar Sessão
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
