import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { WorkoutSession } from "../workout.types";

interface ActiveWorkoutState {
    activeSession: WorkoutSession | null;
    lastSession: WorkoutSession | null;
}

interface ActiveWorkoutActions {
    setActiveSession: (session: WorkoutSession | null, lastSession?: WorkoutSession | null) => void;
    clearState: () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState & ActiveWorkoutActions>()(
    persist(
        (set) => ({
            activeSession: null,
            lastSession: null,

            setActiveSession: (session, lastSession = null) => set({ 
                activeSession: session, 
                lastSession: lastSession 
            }),

            clearState: () => set({ activeSession: null, lastSession: null }),
        }),
        {
            name: "active-workout-storage",
            storage: createJSONStorage(() => localStorage)
        }
    )
)
