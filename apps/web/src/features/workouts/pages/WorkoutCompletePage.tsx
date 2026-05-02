import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion, useAnimation } from "framer-motion";
import { Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { path } from "@/core/constants/path";
import { useActiveWorkoutStore } from "@/features/workouts/stores/active-workout.store";
import { useWorkoutSession } from "@/features/workouts/hooks/useWorkoutSession";
import { WorkoutSessionService } from "@/features/workouts/services/workout-session/workout-session.service";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";

type Phase = 'entering' | 'holding' | 'exiting';

const WorkoutCompletePage = () => {
    const [, navigate] = useLocation();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const controls = useAnimation();
    const circleControls = useAnimation();

    const finalization = useActiveWorkoutStore((s) => s.finalization);
    const resetFinalization = useActiveWorkoutStore((s) => s.resetFinalization);
    const { finishSession } = useWorkoutSession();

    const [phase, setPhase] = useState<Phase>('entering');
    const [retryKey, setRetryKey] = useState(0);

    const sessionId = id ? parseInt(id) : null;

    // On mount: if no active finalization, skip straight to summary
    useEffect(() => {
        if (finalization.status === 'idle') {
            navigate(`${path.WORKOUT_SUMMARY}/${id}`, { replace: true });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Start entry animation
    useEffect(() => {
        controls.set({ x: "100vw" });
        circleControls.set({ scale: 0 });

        controls
            .start({ x: "0vw", transition: { duration: 0.4, ease: "easeOut" } })
            .then(() => {
                circleControls.start({
                    scale: 1,
                    transition: { type: "spring", stiffness: 280, damping: 18 },
                });
                setPhase('holding');
            });
    }, [retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // When holding and API succeeded → prefetch then exit
    useEffect(() => {
        if (phase !== 'holding' || finalization.status !== 'success') return;

        // Prefetch summary data while exit animation plays
        if (sessionId) {
            void queryClient.prefetchQuery({
                queryKey: ["workoutSession", sessionId],
                queryFn: () => WorkoutSessionService.getById(sessionId),
            });
        }

        // Brief pause at center, then exit
        const timer = setTimeout(() => {
            setPhase('exiting');
            void controls
                .start({ x: "-100vw", transition: { duration: 0.4, ease: "easeIn" } })
                .then(() => {
                    resetFinalization();
                    navigate(`${path.WORKOUT_SUMMARY}/${id}`, { replace: true });
                });
        }, 200);

        return () => clearTimeout(timer);
    }, [phase, finalization.status]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRetry = () => {
        setPhase('entering');
        setRetryKey(k => k + 1);
        void finishSession();
    };

    // Error state
    if (finalization.status === 'error') {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 px-8">
                <InlineErrorBanner
                    message={finalization.error ?? "Não foi possível finalizar o treino."}
                    actionLabel="Tentar novamente"
                    onAction={handleRetry}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
            <motion.div animate={controls} className="flex items-center justify-center">
                <motion.div
                    animate={circleControls}
                    className="w-24 h-24 rounded-full bg-success flex items-center justify-center"
                >
                    <Check className="w-12 h-12 text-white" strokeWidth={2.5} />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default WorkoutCompletePage;
