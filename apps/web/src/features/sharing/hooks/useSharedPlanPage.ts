import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { summarizePlannedVolume } from "@plato/shared";
import { path } from "@/core/constants/path.ts";
import { useAppMutation } from "@/core/hooks/useAppMutation";
import { useAuthStore } from "@/features/auth/auth.store.ts";
import { SharingService } from "@/features/sharing/sharing.service.ts";
import type { AddSharedPlanResult, PublicSharedPlan } from "@/features/sharing/sharing.types.ts";
import { consumePendingAdd, markPendingAdd } from "@/features/sharing/utils/share-link.ts";

const statusOf = (error: unknown) => (isAxiosError(error) ? error.response?.status : undefined);

const successMessage = ({ kind, alreadyAdded }: AddSharedPlanResult) => {
    if (alreadyAdded) return "Você já tinha adicionado este plano.";

    return kind === "PROGRAM" ? "Programa adicionado." : "Treino adicionado.";
};

const summarize = (plan: PublicSharedPlan) => {
    const exercises = plan.workouts.flatMap((workout) => workout.exercises);

    return {
        totalExercises: exercises.length,
        totalSets: exercises.reduce((sum, item) => sum + item.targetSets, 0),
        muscles: summarizePlannedVolume(plan.workouts.map((workout) => ({
            id: workout.orderIndex,
            name: workout.name,
            exercises: workout.exercises.map((item) => ({
                targetSets: item.targetSets,
                targetMuscle: item.exercise.targetMuscle,
            })),
        }))),
    };
};

export const useSharedPlanPage = (token: string) => {
    const [, navigate] = useLocation();
    const search = useSearch();
    const isAuthenticated = useAuthStore((state) => !!state.token);
    const autoAddHandled = useRef(false);

    const planQuery = useQuery({
        queryKey: ["shared-plan", token],
        queryFn: () => SharingService.getPublic(token),
        // Link indisponível é resposta definitiva: tentar de novo só atrasaria a tela.
        retry: (failureCount, error) => statusOf(error) !== 404 && failureCount < 2,
    });

    const sendToAuth = (target: string) => {
        markPendingAdd(token);
        navigate(`${target}?next=${encodeURIComponent(`${path.SHARED}/${token}?add=1`)}`);
    };

    const addMutation = useAppMutation({
        mutationFn: () => SharingService.add(token),
        invalidateQueries: [["workouts"], ["programs"], ["active-program"]],
        suppressDefaultError: true,
        onSuccess: (result: AddSharedPlanResult) => {
            toast.success(successMessage(result));
            navigate(result.kind === "PROGRAM" && !result.activated ? path.PROGRAMS : path.WORKOUTS);
        },
        onError: (error: unknown) => {
            const status = statusOf(error);

            // O interceptor já limpou a sessão vencida: entra de novo e volta para cá.
            if (status === 401) {
                sendToAuth(path.LOGIN);
                return;
            }

            if (status === 404) {
                void planQuery.refetch();
                return;
            }

            toast.error("Não foi possível adicionar. Tente novamente.");
        },
    });

    const { mutate: addPlan } = addMutation;
    const wantsAutoAdd = new URLSearchParams(search).get("add") === "1";
    const isPlanReady = planQuery.isSuccess;

    useEffect(() => {
        if (!wantsAutoAdd || !isAuthenticated || !isPlanReady || autoAddHandled.current) return;

        autoAddHandled.current = true;
        navigate(`${path.SHARED}/${token}`, { replace: true });

        if (consumePendingAdd(token)) addPlan();
    }, [wantsAutoAdd, isAuthenticated, isPlanReady, token, navigate, addPlan]);

    const handleAdd = () => {
        if (!isAuthenticated) {
            sendToAuth(path.SIGNUP);
            return;
        }

        addPlan();
    };

    const plan = planQuery.data;
    const summary = useMemo(() => (plan ? summarize(plan) : null), [plan]);

    return {
        plan,
        summary,
        isLoading: planQuery.isLoading,
        isUnavailable: planQuery.isError && statusOf(planQuery.error) === 404,
        hasLoadError: planQuery.isError && statusOf(planQuery.error) !== 404,
        retry: () => void planQuery.refetch(),
        isAuthenticated,
        isAdding: addMutation.isPending,
        handleAdd,
        handleLogin: () => sendToAuth(path.LOGIN),
        goHome: () => navigate(path.LOGIN),
    };
};
