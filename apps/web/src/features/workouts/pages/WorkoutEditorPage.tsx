import { motion, type Variants } from "framer-motion";
import { DndContext } from "@dnd-kit/core";
import NewExerciseSheet from "@/features/workouts/components/workout-editor/exercise-list/new-exercise-sheet/NewExerciseSheet.tsx";
import { WorkoutEditorSkeleton } from "@/features/workouts/components/workout-editor/WorkoutEditorSkeleton.tsx";
import { useWorkoutEditorLogic } from "@/features/workouts/hooks/useWorkoutEditorLogic.ts";
import { WorkoutEditorForm } from "@/features/workouts/components/workout-editor/components/WorkoutEditorForm.tsx";
import { WorkoutEditorActions } from "@/features/workouts/components/workout-editor/components/WorkoutEditorActions.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import RedundancyNotice from "@/features/workouts/components/workout-editor/RedundancyNotice.tsx";
import AlternativesSheet from "@/features/workouts/components/workout-editor/AlternativesSheet.tsx";
import PlannedVolumePanel from "@/features/workouts/components/workout-editor/PlannedVolumePanel.tsx";
import { usePlannedVolume } from "@/features/workouts/hooks/usePlannedVolume.ts";

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
        id,
        isFetching,
        isSaving,
        isSuccess,
        validationErrors,
        saveError,
        sensors,
        collisionDetection,
        handleSubmit,
        handleNameBlur,
        handleNameChange,
        handleDragEnd,
        handleDragStart,
        redundantGroups,
        inspectedDraft,
        setInspectedDraft,
        handleReplaceInspected,
    } = useWorkoutEditorLogic();

    const plannedVolume = usePlannedVolume(id);

    const FORM_ID = "workout-editor-form";

    if (isFetching) return <WorkoutEditorSkeleton />;

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
                <WorkoutEditorForm
                    formId={FORM_ID}
                    onSubmit={handleSubmit}
                    nameError={validationErrors.name}
                    onNameBlur={handleNameBlur}
                    onNameChange={handleNameChange}
                />
                <NewExerciseSheet />

                <RedundancyNotice groups={redundantGroups} onInspect={setInspectedDraft} />
                <PlannedVolumePanel
                    rows={plannedVolume.rows}
                    cycleLength={plannedVolume.cycleLength}
                    sessionsPerWeek={plannedVolume.sessionsPerWeek}
                    draftIsAddition={plannedVolume.draftIsAddition}
                />
                <AlternativesSheet
                    target={inspectedDraft?.exercise ?? null}
                    onClose={() => setInspectedDraft(null)}
                    onSelect={handleReplaceInspected}
                />

                {validationErrors.exercises && (
                    <p
                        data-exercises-error
                        role="alert"
                        tabIndex={-1}
                        className="text-destructive text-[12px] px-1 outline-none"
                    >
                        {validationErrors.exercises}
                    </p>
                )}

                {saveError && (
                    <InlineErrorBanner message={saveError} />
                )}

                {/* Salvar não bloqueia mais a tela: o próprio botão já vira
                    "Salvando..." e depois "Salvo!", e fica disabled. O overlay
                    cobria o editor inteiro durante o POST — era exatamente o
                    "covers the screen even while saving" do relatório. */}
                <WorkoutEditorActions
                    formId={FORM_ID}
                    isSaving={isSaving}
                    isSuccess={isSuccess}
                />
            </motion.div>
        </DndContext>
    );
};

export default WorkoutEditorPage;
