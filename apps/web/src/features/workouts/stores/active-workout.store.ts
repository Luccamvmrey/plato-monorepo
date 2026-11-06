import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { WorkoutSession, SessionSetPayload, FinishSessionPayload } from "../workout.types";

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
    payload: FinishSessionPayload | null;
}

interface ActiveWorkoutState {
    activeSession: ActiveSession | null;
    lastSession: WorkoutSession | null;
    finalization: FinalizationState;
    /** Quando o descanso atual termina. Timestamp, para sobreviver à tela apagada. */
    restEndsAt: number | null;
    /** Duração preferida, em segundos. Ajustar o descanso atual também muda esta. */
    restDuration: number;
    /** Quando a última série foi registrada. É o horário que vale para quem esquece de concluir. */
    lastSetAt: number | null;
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
    setExerciseWeight: (exerciseId: number, weight: number | null) => void;
    undoLastSet: (exerciseId: number) => void;
    startRest: () => void;
    adjustRest: (deltaSeconds: number) => void;
    dismissRest: () => void;
}

const DEFAULT_REST_SECONDS = 90;
const MIN_REST_SECONDS = 15;
const MAX_REST_SECONDS = 600;

const IDLE_FINALIZATION: FinalizationState = { status: 'idle', sessionId: null, error: null, payload: null };

export const useActiveWorkoutStore = create<ActiveWorkoutState & ActiveWorkoutActions>()(
    persist(
        (set) => ({
            activeSession: null,
            lastSession: null,
            finalization: IDLE_FINALIZATION,
            restEndsAt: null,
            restDuration: DEFAULT_REST_SECONDS,
            lastSetAt: null,

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
                    lastSetAt: session && session.id === state.activeSession?.id ? state.lastSetAt : null,
                })),

            clearState: () => set({ activeSession: null, lastSession: null, restEndsAt: null, lastSetAt: null }),

            // Uma carga por exercício, no modo simplificado: vale para todas as séries.
            setExerciseWeight: (exerciseId, weight) =>
                set((state) => ({
                    activeSession: state.activeSession
                        ? {
                            ...state.activeSession,
                            pendingSets: state.activeSession.pendingSets.map((pending) =>
                                pending.exerciseId === exerciseId
                                    ? { ...pending, actualWeight: weight }
                                    : pending
                            ),
                          }
                        : state.activeSession,
                })),

            undoLastSet: (exerciseId) =>
                set((state) => {
                    if (!state.activeSession) return state;

                    const { pendingSets } = state.activeSession;
                    const lastIndex = pendingSets.map((pending) => pending.exerciseId).lastIndexOf(exerciseId);

                    if (lastIndex === -1) return state;

                    return {
                        // O descanso era o da série desfeita.
                        restEndsAt: null,
                        activeSession: {
                            ...state.activeSession,
                            pendingSets: pendingSets.filter((_, index) => index !== lastIndex),
                        },
                    };
                }),

            startRest: () =>
                set((state) => ({ restEndsAt: Date.now() + state.restDuration * 1000 })),

            adjustRest: (deltaSeconds) =>
                set((state) => ({
                    restDuration: Math.min(
                        MAX_REST_SECONDS,
                        Math.max(MIN_REST_SECONDS, state.restDuration + deltaSeconds)
                    ),
                    restEndsAt: state.restEndsAt === null
                        ? null
                        : state.restEndsAt + deltaSeconds * 1000,
                })),

            dismissRest: () => set({ restEndsAt: null }),

            addPendingSet: (payload) =>
                set((state) => ({
                    lastSetAt: Date.now(),
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
                restEndsAt: state.restEndsAt,
                restDuration: state.restDuration,
                lastSetAt: state.lastSetAt,
            }),
        }
    )
)
