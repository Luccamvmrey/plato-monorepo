import { DndContext } from "@dnd-kit/core";
import NewExerciseSheet
    from "@/features/workouts/components/workout-editor/exercise-list/new-exercise-sheet/NewExerciseSheet.tsx";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { useWorkoutEditorLogic } from "@/features/workouts/hooks/useWorkoutEditorLogic.ts";
import { WorkoutEditorForm } from "@/features/workouts/components/workout-editor/components/WorkoutEditorForm.tsx";
import { WorkoutEditorActions } from "@/features/workouts/components/workout-editor/components/WorkoutEditorActions.tsx";


const WorkoutEditorPage = () => {
    const {
        isFetching,
        isSaving,
        sensors,
        collisionDetection,
        handleSubmit,
        handleDragEnd,
        handleDragStart,
    } = useWorkoutEditorLogic();

    const FORM_ID = "workout-editor-form";

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
        >
            <div className="h-full flex flex-col gap-3 mb-[100px] overflow-y-auto">
                <WorkoutEditorForm formId={FORM_ID} onSubmit={handleSubmit} />
                <NewExerciseSheet/>
                <WorkoutEditorActions formId={FORM_ID} isSaving={isSaving} />
            </div>

            <LoadingOverlay isLoading={isFetching || isSaving}/>
        </DndContext>
    );
};

export default WorkoutEditorPage;