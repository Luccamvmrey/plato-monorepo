import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { WorkoutSession, SessionSetPayload } from "../workout.types";

type ActiveSession = WorkoutSession & {
    pendingSets: SessionSetPayload[];
    exerciseNotes: Record<number, string>;
    exerciseExtraSets: Record<number, number>;
    sessionExerciseOrder: number[] | null;
}

type FinalizationStatus = 'idle' | 'pending' | 'success' | 'error';

interface FinalizationState {
    status: FinalizationStatus;
    sessionId: number | null;
    error: string | null;
}

interface ActiveWorkoutState {
    activeSession: ActiveSession | null;
    lastSession: WorkoutSession | null;
    finalization: FinalizationState;
}

interface ActiveWorkoutActions {
    setActiveSession: (session: WorkoutSession | null, lastSession?: WorkoutSession | null) => void;
    clearState: () => void;
    addPendingSet: (payload: SessionSetPayload) => void;
    setFinalization: (state: FinalizationState) => void;
    resetFinalization: () => void;
    setExerciseNote: (exerciseId: number, note: string) => void;
    addExtraSet: (exerciseId: number) => void;
    setExerciseOrder: (order: number[]) => void;
}

const IDLE_FINALIZATION: FinalizationState = { status: 'idle', sessionId: null, error: null };

export const useActiveWorkoutStore = create<ActiveWorkoutState & ActiveWorkoutActions>()(
    persist(
        (set) => ({
            activeSession: null,
            lastSession: null,
            finalization: IDLE_FINALIZATION,

            setActiveSession: (session, lastSession = null) =>
                set((state) => ({
                    activeSession: session
                        ? {
                            ...session,
                            pendingSets: state.activeSession?.pendingSets ?? [],
                            exerciseNotes: state.activeSession?.exerciseNotes ?? {},
                            exerciseExtraSets: state.activeSession?.exerciseExtraSets ?? {},
                            sessionExerciseOrder: state.activeSession?.sessionExerciseOrder ?? null,
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

            setExerciseNote: (exerciseId, note) =>
                set((state) => ({
                    activeSession: state.activeSession
                        ? {
                            ...state.activeSession,
                            exerciseNotes: { ...state.activeSession.exerciseNotes, [exerciseId]: note },
                          }
                        : state.activeSession,
                })),

            addExtraSet: (exerciseId) =>
                set((state) => ({
                    activeSession: state.activeSession
                        ? {
                            ...state.activeSession,
                            exerciseExtraSets: {
                                ...state.activeSession.exerciseExtraSets,
                                [exerciseId]: (state.activeSession.exerciseExtraSets[exerciseId] ?? 0) + 1,
                            },
                          }
                        : state.activeSession,
                })),

            setExerciseOrder: (order) =>
                set((state) => ({
                    activeSession: state.activeSession
                        ? { ...state.activeSession, sessionExerciseOrder: order }
                        : state.activeSession,
                })),

            setFinalization: (finalization) => set({ finalization }),

            resetFinalization: () => set({ finalization: IDLE_FINALIZATION }),
        }),
        {
            name: "active-workout-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                activeSession: state.activeSession,
                lastSession: state.lastSession,
            }),
        }
    )
)
