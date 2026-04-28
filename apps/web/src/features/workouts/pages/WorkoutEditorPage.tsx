import { motion, type Variants } from "framer-motion";
import { DndContext } from "@dnd-kit/core";
import NewExerciseSheet from "@/features/workouts/components/workout-editor/exercise-list/new-exercise-sheet/NewExerciseSheet.tsx";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { useWorkoutEditorLogic } from "@/features/workouts/hooks/useWorkoutEditorLogic.ts";
import { WorkoutEditorForm } from "@/features/workouts/components/workout-editor/components/WorkoutEditorForm.tsx";
import { WorkoutEditorActions } from "@/features/workouts/components/workout-editor/components/WorkoutEditorActions.tsx";

const enterAnimation: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 380, damping: 28, delay: 0.04 },
    },
};

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
            <motion.div
                variants={enterAnimation}
                initial="hidden"
                animate="show"
                className="h-full flex flex-col gap-3 mb-[100px]"
            >
                <WorkoutEditorForm formId={FORM_ID} onSubmit={handleSubmit} />
                <NewExerciseSheet />
                <WorkoutEditorActions formId={FORM_ID} isSaving={isSaving} />
            </motion.div>

            <LoadingOverlay isLoading={isFetching || isSaving} />
        </DndContext>
    );
};

export default WorkoutEditorPage;
