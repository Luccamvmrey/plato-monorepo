import WorkoutInfo from "../WorkoutInfo.tsx";
import ExerciseList from "../exercise-list/ExerciseList.tsx";
import type { FormEvent } from "react";

interface WorkoutEditorFormProps {
    formId: string;
    onSubmit: (e: FormEvent) => void;
}

export const WorkoutEditorForm = ({ formId, onSubmit }: WorkoutEditorFormProps) => {
    return (
        <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-3">
            <WorkoutInfo />
            <ExerciseList />
        </form>
    );
};
