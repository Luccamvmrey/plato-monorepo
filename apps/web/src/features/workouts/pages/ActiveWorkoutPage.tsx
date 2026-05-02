import { motion, type Variants } from "framer-motion";
import { useActiveWorkoutLogic } from "@/features/workouts/hooks/useActiveWorkoutLogic.ts";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { Button } from "@/components/ui/button.tsx";
import { path } from "@/core/constants/path.ts";
import ActiveWorkoutHeader from "@/features/workouts/components/active-workout/ActiveWorkoutHeader.tsx";
import DynamicExerciseStack from "@/features/workouts/components/active-workout/exercise-stack/DynamicExerciseStack.tsx";
import { ActiveWorkoutActions } from "@/features/workouts/components/active-workout/components/ActiveWorkoutActions.tsx";
import { FinishWorkoutDialog } from "@/features/workouts/components/active-workout/components/dialogs/FinishWorkoutDialog";
import { CancelWorkoutDialog } from "@/features/workouts/components/active-workout/components/dialogs/CancelWorkoutDialog";
import { SessionProgress } from "@/features/workouts/components/active-workout/SessionProgress.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";

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
        activeSession,
        lastSession,
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
        isFinishPending,
        finishError,
        cancelError,
        isCancelPending,
        isAllCompleted,
        navigate,
    } = useActiveWorkoutLogic();

    if (isLoading) {
        return <LoadingOverlay isLoading={true} />;
    }

    if (!activeSession) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <p className="text-muted-foreground">Nenhuma sessão ativa encontrada.</p>
                <Button onClick={() => navigate(path.WORKOUTS)}>Ir para Biblioteca</Button>
            </div>
        );
    }

    return (
        <motion.div
            variants={enterAnimation}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3 pb-[320px]"
        >
            <ActiveWorkoutHeader
                workout={workout}
                session={activeSession}
                onBackClick={() => setIsCancelOpen(true)}
            />

            <SessionProgress exerciseStack={exerciseStack} />

            <DynamicExerciseStack
                exerciseStack={exerciseStack}
                session={activeSession}
                lastSession={lastSession}
            />

            <ActiveWorkoutActions
                onFinishClick={handleFinishClick}
                onCancelClick={() => setIsCancelOpen(true)}
                isFinishPending={isFinishPending}
                isCancelPending={isCancelPending}
                isAllCompleted={isAllCompleted}
            />

            {finishError && (
                <InlineErrorBanner
                    message={finishError}
                    actionLabel="Tentar novamente"
                    onAction={handleFinishConfirm}
                    className="mt-3"
                />
            )}

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
