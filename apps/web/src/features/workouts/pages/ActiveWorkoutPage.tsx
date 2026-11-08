import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { useActiveWorkoutLogic } from "@/features/workouts/hooks/useActiveWorkoutLogic.ts";
import { ActiveWorkoutSkeleton } from "@/features/workouts/components/active-workout/ActiveWorkoutSkeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { path } from "@/core/constants/path.ts";
import ActiveWorkoutHeader from "@/features/workouts/components/active-workout/ActiveWorkoutHeader.tsx";
import DynamicExerciseStack from "@/features/workouts/components/active-workout/exercise-stack/DynamicExerciseStack.tsx";
import { ActiveWorkoutActions } from "@/features/workouts/components/active-workout/components/ActiveWorkoutActions.tsx";
import { FinishWorkoutDialog } from "@/features/workouts/components/active-workout/components/dialogs/FinishWorkoutDialog";
import { CancelWorkoutDialog } from "@/features/workouts/components/active-workout/components/dialogs/CancelWorkoutDialog";
import { SessionProgress } from "@/features/workouts/components/active-workout/SessionProgress.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { useKeyboardOpen } from "@/core/hooks/useKeyboardOpen.ts";
import { cn } from "@/lib/utils.ts";

const enterAnimation: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 380, damping: 28, delay: 0.04 },
    },
};

const ActiveWorkoutPage = () => {
    const {
        id,
        activeSession,
        exerciseHistory,
        lastWeights,
        workout,
        exerciseStack,
        isLoading,
        isConfirmOpen,
        setIsConfirmOpen,
        isCancelOpen,
        setIsCancelOpen,
        handleFinishClick,
        handleFinishConfirm,
        handleCancelConfirm,
        cancelError,
        isCancelPending,
        isAllCompleted,
        navigate,
        setExerciseOrder,
        addExtraSet,
    } = useActiveWorkoutLogic();

    const isKeyboardOpen = useKeyboardOpen();

    useEffect(() => {
        if (isLoading || !activeSession || id) return;
        navigate(`${path.ACTIVE_WORKOUT}/${activeSession.workoutId}`);
    }, [activeSession, id, isLoading, navigate]);

    if (isLoading) {
        return <ActiveWorkoutSkeleton />;
    }

    if (!activeSession) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <p className="text-muted-foreground">Nenhuma sessão ativa encontrada.</p>
                <Button onClick={() => navigate(path.WORKOUTS)}>Ir para Biblioteca</Button>
            </div>
        );
    }

    // O pb dá folga para o último card passar acima do rodapé fixo, que agora é
    // uma linha só e sem NavBar embaixo.
    return (
        <motion.div
            variants={enterAnimation}
            initial="hidden"
            animate="show"
            className={cn("flex flex-col gap-3", isKeyboardOpen ? "pb-6" : "pb-[calc(var(--safe-bottom)+120px)]")}
        >
            {/* Sem NavBar na sessão, o "<" é a saída: deixa o treino aberto e o
                ActiveSessionBanner traz de volta. Cancelar fica no menu. */}
            <ActiveWorkoutHeader
                workout={workout}
                session={activeSession}
                onBackClick={() => navigate(path.WORKOUTS)}
                onCancelClick={() => setIsCancelOpen(true)}
                isCancelPending={isCancelPending}
            />

            <SessionProgress exerciseStack={exerciseStack} />

            <DynamicExerciseStack
                exerciseStack={exerciseStack}
                session={activeSession}
                history={exerciseHistory}
                lastWeights={lastWeights}
                setExerciseOrder={setExerciseOrder}
                addExtraSet={addExtraSet}
            />

            <ActiveWorkoutActions
                onFinishClick={handleFinishClick}
                isFinishPending={false}
                isCancelPending={isCancelPending}
                isAllCompleted={isAllCompleted}
            />

            {cancelError && (
                <InlineErrorBanner
                    message={cancelError}
                    actionLabel="Tentar novamente"
                    onAction={handleCancelConfirm}
                    className="mt-3"
                />
            )}

            <FinishWorkoutDialog
                isOpen={isConfirmOpen}
                setOpen={setIsConfirmOpen}
                onConfirm={handleFinishConfirm}
            />

            <CancelWorkoutDialog
                isOpen={isCancelOpen}
                setOpen={setIsCancelOpen}
                onConfirm={handleCancelConfirm}
            />
        </motion.div>
    );
};

export default ActiveWorkoutPage;
