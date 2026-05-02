import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { WorkoutSession, SessionSetPayload } from "../workout.types";

type ActiveSession = WorkoutSession & { pendingSets: SessionSetPayload[] }

interface ActiveWorkoutState {
    activeSession: ActiveSession | null;
    lastSession: WorkoutSession | null;
}

interface ActiveWorkoutActions {
    setActiveSession: (session: WorkoutSession | null, lastSession?: WorkoutSession | null) => void;
    clearState: () => void;
    addPendingSet: (set: SessionSetPayload) => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState & ActiveWorkoutActions>()(
    persist(
        (set) => ({
            activeSession: null,
            lastSession: null,

            setActiveSession: (session, lastSession = null) =>
                set((state) => ({
                    activeSession: session
                        ? {
                            ...session,
                            pendingSets: state.activeSession?.pendingSets ?? [],
                          }
                        : null,
                    lastSession,
                })),

            clearState: () => set({ activeSession: null, lastSession: null }),

            addPendingSet: (payload) =>
                set((state) => ({
                    activeSession: state.activeSession
                        ? {
                            ...state.activeSession,
                            pendingSets: [...state.activeSession.pendingSets, payload],
                          }
                        : state.activeSession,
                })),
        }),
        {
            name: "active-workout-storage",
            storage: createJSONStorage(() => localStorage)
        }
    )
)
