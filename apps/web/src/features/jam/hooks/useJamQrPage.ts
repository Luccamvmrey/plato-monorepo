import { useLocation } from "wouter";
import { JAM_MAX_MEMBERS } from "@plato/shared";
import { path } from "@/core/constants/path.ts";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { useActiveSession } from "@/features/workouts/hooks/useActiveSession.ts";
import { useJam } from "./useJam.ts";

/** Tela do QR: quem criou mostra, quem já está pode mostrar para chamar mais alguém. */
export const useJamQrPage = (jamId: number) => {
    const [, navigate] = useLocation();
    const currentUserId = useAuthStore((state) => state.user?.id);
    const jamQuery = useJam(jamId);
    const { findActiveSessionQuery } = useActiveSession();

    const jam = jamQuery.data;
    const activeMembers = jam?.members.filter((member) => member.leftAt === null).length ?? 0;
    const workoutId = findActiveSessionQuery.data?.activeSession?.workoutId;

    return {
        jam,
        isLoading: jamQuery.isLoading,
        isUnavailable: jamQuery.isError,
        currentUserId,
        memberLabel: `${activeMembers} de ${JAM_MAX_MEMBERS} pessoas`,
        handleStart: () => navigate(workoutId ? `${path.ACTIVE_WORKOUT}/${workoutId}` : path.WORKOUTS),
    };
};
