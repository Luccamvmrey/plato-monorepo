import { useActiveWorkoutLogic } from "@/features/workouts/hooks/useActiveWorkoutLogic.ts";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { Button } from "@/components/ui/button.tsx";
import { path } from "@/core/constants/path.ts";
import ActiveWorkoutHeader from "@/features/workouts/components/active-workout/ActiveWorkoutHeader.tsx";
import DynamicExerciseStack
    from "@/features/workouts/components/active-workout/exercise-stack/DynamicExerciseStack.tsx";
import { ActiveWorkoutActions } from "@/features/workouts/components/active-workout/components/ActiveWorkoutActions.tsx";
import { FinishWorkoutDialog } from "@/features/workouts/components/active-workout/components/dialogs/FinishWorkoutDialog";
import { CancelWorkoutDialog } from "@/features/workouts/components/active-workout/components/dialogs/CancelWorkoutDialog";

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
        isCancelPending,
        navigate
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
        <div className="h-full flex flex-col gap-3 mb-[100px]">
            <ActiveWorkoutHeader 
                workout={workout} 
                session={activeSession} 
            />

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
            />

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
        </div>
    );
};

export default ActiveWorkoutPage;