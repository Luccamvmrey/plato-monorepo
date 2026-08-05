import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EnrichedExerciseRecord, ExerciseHistoryMap, WorkoutSession } from "@/features/workouts/workout.types.ts";
import ExerciseRecord from "@/features/workouts/components/active-workout/exercise-stack/ExerciseRecord.tsx";
import { useAutoTransition } from "@/features/workouts/hooks/useAutoTransition.ts";

type DynamicExerciseStackProps = {
    exerciseStack: EnrichedExerciseRecord[];
    session: WorkoutSession;
    history?: ExerciseHistoryMap;
    setExerciseOrder: (order: number[]) => void;
    addExtraSet: (exerciseId: number) => void;
};

const DynamicExerciseStack = ({
    exerciseStack,
    session,
    history,
    setExerciseOrder,
    addExtraSet,
}: DynamicExerciseStackProps) => {
    useAutoTransition(exerciseStack);

    const [swapCandidateId, setSwapCandidateId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        })
    );

    const pendingIds = exerciseStack
        .filter((r) => r.status === "PENDING")
        .map((r) => r.exerciseId);

    const activeRecord = exerciseStack.find((r) => r.status === "ACTIVE");
    const canSwap = !!activeRecord && activeRecord.logs.length === 0;

    const swapCandidate = swapCandidateId
        ? exerciseStack.find((r) => r.exerciseId === swapCandidateId)
        : null;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldOrder = exerciseStack.map((r) => r.exerciseId);
        const oldIdx = oldOrder.indexOf(active.id as number);
        const newIdx = oldOrder.indexOf(over.id as number);

        const newOrder = [...oldOrder];
        newOrder.splice(oldIdx, 1);
        newOrder.splice(newIdx, 0, active.id as number);
        setExerciseOrder(newOrder);
    };

    const handleSwapConfirm = () => {
        if (!swapCandidateId || !activeRecord) return;

        const oldOrder = exerciseStack.map((r) => r.exerciseId);
        const activeIdx = oldOrder.indexOf(activeRecord.exerciseId);
        const candidateIdx = oldOrder.indexOf(swapCandidateId);

        const newOrder = [...oldOrder];
        newOrder.splice(candidateIdx, 1);
        newOrder.splice(activeIdx, 0, swapCandidateId);
        setExerciseOrder(newOrder);
        setSwapCandidateId(null);
    };

    if (!exerciseStack.length) {
        return (
            <div className="text-muted-foreground text-center p-4 border rounded-xl border-dashed">
                Nenhum exercício planejado para este treino.
            </div>
        );
    }

    return (
        <>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext items={pendingIds} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3">
                        {exerciseStack.map((record) => (
                            <div key={`${record.exerciseId}-${record.status}`} id={`exercise-${record.exerciseId}`}>
                                <ExerciseRecord
                                    record={record}
                                    sessionId={session.id}
                                    history={history}
                                    addExtraSet={addExtraSet}
                                    onSwapRequest={
                                        canSwap && record.status === "PENDING"
                                            ? () => setSwapCandidateId(record.exerciseId)
                                            : undefined
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <AlertDialog open={!!swapCandidateId} onOpenChange={() => setSwapCandidateId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Trocar exercício ativo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Iniciar {swapCandidate?.exercise.name} agora? O exercício atual será movido para a fila.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSwapConfirm}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default DynamicExerciseStack;
