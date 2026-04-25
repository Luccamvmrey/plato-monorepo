import { useEffect, useRef } from "react";
import type { EnrichedExerciseRecord } from "@/features/workouts/workout.types.ts";

export const useAutoTransition = (exerciseStack: EnrichedExerciseRecord[]) => {
    const prevActiveIndex = useRef<number>(-1);

    useEffect(() => {
        if (!exerciseStack.length) return;

        const activeIndex = exerciseStack.findIndex(record => record.status === "ACTIVE");
        
        // If we found an active exercise and it's different from the previous one (meaning someone just finished an exercise)
        if (activeIndex !== -1 && prevActiveIndex.current !== -1 && activeIndex !== prevActiveIndex.current) {
            const element = document.getElementById(`exercise-${exerciseStack[activeIndex].exerciseId}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }

        prevActiveIndex.current = activeIndex;
    }, [exerciseStack]);
};
