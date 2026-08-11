import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { path } from "@/core/constants/path.ts";
import { usePrograms } from "@/features/workouts/hooks/usePrograms.ts";
import { useWorkouts } from "@/features/workouts/hooks/useWorkouts.ts";

export const useProgramEditorLogic = () => {
    const navigate = useLocation()[1];
    const { id } = useParams();
    const isNew = !id || id === "new";

    const {
        programByIdQuery,
        createProgramMutation,
        updateProgramMutation,
    } = usePrograms(id);

    // Só treinos ativos entram num programa: arquivar um treino é justamente dizer
    // que ele saiu da rotação.
    const { userWorkoutsQuery } = useWorkouts(undefined, true);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const program = programByIdQuery.data;

    // O dado do programa chega DEPOIS da primeira renderização, então precisa semear
    // os campos. Isto é ajuste de estado DURANTE A RENDER, não efeito: semear num
    // useEffect dispara `react-hooks/set-state-in-effect` e provoca exatamente a
    // render em cascata que a regra existe para evitar.
    //
    // A guarda é o id já semeado — sem ela, uma resposta tardia da query
    // sobrescreveria o que o usuário digitou no meio tempo.
    //
    // O editor de treino resolve o mesmo problema com um store Zustand, mas lá é por
    // outro motivo: a sheet de exercícios fica longe da página na árvore. Aqui as
    // ações descem por prop em dois níveis, então store seria máquina sem carga.
    const [seededProgramId, setSeededProgramId] = useState<string | null>(null);

    if (!isNew && program && seededProgramId !== id) {
        setSeededProgramId(id ?? null);
        setName(program.name);
        setDescription(program.description ?? "");
        setSelectedIds(program.programWorkout.map((entry) => entry.workoutId));
    }

    const workouts = userWorkoutsQuery.data;

    const selectedWorkouts = useMemo(
        () =>
            selectedIds
                .map((workoutId) => workouts?.find((workout) => workout.id === workoutId))
                .filter((workout) => workout !== undefined),
        [selectedIds, workouts]
    );

    const availableWorkouts = useMemo(
        () => (workouts ?? []).filter((workout) => !selectedIds.includes(workout.id)),
        [workouts, selectedIds]
    );

    const addWorkout = (workoutId: number) =>
        setSelectedIds((prev) => (prev.includes(workoutId) ? prev : [...prev, workoutId]));

    const removeWorkout = (workoutId: number) =>
        setSelectedIds((prev) => prev.filter((current) => current !== workoutId));

    /** Move uma posição do ciclo. `direction` é -1 (sobe) ou 1 (desce). */
    const moveWorkout = (index: number, direction: -1 | 1) =>
        setSelectedIds((prev) => {
            const target = index + direction;
            if (target < 0 || target >= prev.length) return prev;

            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });

    const isPending = createProgramMutation.isPending || updateProgramMutation.isPending;
    const canSubmit = name.trim().length > 0 && selectedIds.length > 0 && !isPending;

    const handleSubmit = () => {
        if (!canSubmit) return;

        const payload = {
            name: name.trim(),
            description: description.trim() || undefined,
            workoutIds: selectedIds,
        };

        const onSuccess = () => navigate(path.PROGRAMS);

        if (isNew) {
            createProgramMutation.mutate(payload, { onSuccess });
            return;
        }

        updateProgramMutation.mutate({ id: id!, payload }, { onSuccess });
    };

    const submitError =
        createProgramMutation.isError || updateProgramMutation.isError
            ? "Não foi possível salvar o programa. Tente novamente."
            : null;

    return {
        isNew,
        name,
        setName,
        description,
        setDescription,
        selectedWorkouts,
        availableWorkouts,
        addWorkout,
        removeWorkout,
        moveWorkout,
        handleSubmit,
        handleCancel: () => navigate(path.PROGRAMS),
        canSubmit,
        isPending,
        isLoading: (!isNew && programByIdQuery.isLoading) || userWorkoutsQuery.isLoading,
        submitError,
    };
};
