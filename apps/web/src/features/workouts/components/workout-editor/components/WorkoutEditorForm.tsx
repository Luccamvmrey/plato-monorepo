import WorkoutInfo from "../WorkoutInfo.tsx";
import ExerciseList from "../exercise-list/ExerciseList.tsx";
import type { FormEvent } from "react";

interface WorkoutEditorFormProps {
    formId: string;
    onSubmit: (e: FormEvent) => void;
    nameError?: string;
    onNameBlur?: (value: string) => void;
    onNameChange?: (value: string) => void;
}

export const WorkoutEditorForm = ({ formId, onSubmit, nameError, onNameBlur, onNameChange }: WorkoutEditorFormProps) => {
    return (
        <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-3">
            <WorkoutInfo nameError={nameError} onNameBlur={onNameBlur} onNameChange={onNameChange} />
            <ExerciseList />
        </form>
    );
};
