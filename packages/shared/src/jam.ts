/** Mais que isso é aula em grupo, outro produto. */
export const JAM_MAX_MEMBERS = 4;

export type JamExerciseModeValue = "PARALLEL" | "ALTERNATE";

/** O que o aparelho informa: em que exercício a pessoa está e até quando descansa. */
export interface JamPresence {
    exerciseId: number | null;
    /** Epoch em ms. Null fora do descanso. */
    restEndsAt: number | null;
}

/** Uma pessoa vista de um exercício específico. */
export interface JamTurnCandidate {
    userId: number;
    /** Epoch em ms. Desempata a vez. */
    joinedAt: number;
    /** A pessoa está neste exercício agora (pela presença). */
    isHere: boolean;
    setsDone: number;
    targetSets: number;
}

/**
 * De quem é a vez num exercício em revezamento. Entre quem está nele e ainda tem série a
 * fazer, é de quem fez menos; empate, de quem entrou antes na jam.
 *
 * Derivado das séries, nunca guardado: reconexão, rede que caiu e app reaberto se resolvem
 * lendo as séries de novo. Com menos de duas pessoas no rodízio não há vez (null): revezar
 * sozinho é treinar normalmente.
 */
export const resolveJamTurn = (candidates: readonly JamTurnCandidate[]): number | null => {
    const rotation = candidates.filter((candidate) => candidate.isHere && candidate.setsDone < candidate.targetSets);

    if (rotation.length < 2) return null;

    const [next] = [...rotation].sort((a, b) => a.setsDone - b.setsDone || a.joinedAt - b.joinedAt);

    return next.userId;
};

/**
 * Exercício em que quem entra no meio começa: o mais comum entre quem já está treinando;
 * empate, o do host. Só vale exercício que a pessoa tem no treino dela. Null = começa do
 * início, como num treino normal.
 */
export const pickJamEntryExercise = (
    others: readonly { exerciseId: number | null; isHost: boolean }[],
    availableExerciseIds: readonly number[]
): number | null => {
    const available = new Set(availableExerciseIds);
    const counts = new Map<number, { count: number; hasHost: boolean }>();

    for (const { exerciseId, isHost } of others) {
        if (exerciseId === null || !available.has(exerciseId)) continue;

        const current = counts.get(exerciseId) ?? { count: 0, hasHost: false };
        counts.set(exerciseId, { count: current.count + 1, hasHost: current.hasHost || isHost });
    }

    let best: { exerciseId: number; count: number; hasHost: boolean } | null = null;

    for (const [exerciseId, entry] of counts) {
        if (
            best === null ||
            entry.count > best.count ||
            (entry.count === best.count && entry.hasHost && !best.hasHost)
        ) {
            best = { exerciseId, ...entry };
        }
    }

    return best?.exerciseId ?? null;
};

/** Modo de um exercício. Ausente no mapa (ou valor estranho no JSON) é PARALLEL. */
export const jamExerciseMode = (modes: unknown, exerciseId: number): JamExerciseModeValue => {
    if (typeof modes !== "object" || modes === null) return "PARALLEL";

    return (modes as Record<string, unknown>)[String(exerciseId)] === "ALTERNATE" ? "ALTERNATE" : "PARALLEL";
};

/**
 * Estado completo da jam, como a API entrega (`GET /jams/:id` e cada evento do stream).
 * Inteiro, não diferenças: com até 4 pessoas cabe em poucos KB, e quem perdeu um evento se
 * corrige no seguinte.
 */
export interface JamState {
    id: number;
    token: string;
    hostUserId: number;
    createdAt: string;
    endedAt: string | null;
    /** Por `exerciseId`. Ausente = PARALLEL. */
    exerciseModes: Record<string, JamExerciseModeValue>;
    /** O treino do host, na ordem dele. */
    workout: {
        name: string;
        exercises: { exerciseId: number; name: string; targetSets: number; targetReps: number }[];
    };
    /** Por ordem de entrada. Inclui quem saiu (`leftAt`), para o resumo saber quem treinou junto. */
    members: JamMemberState[];
}

export interface JamMemberState {
    userId: number;
    /** Só o primeiro nome. */
    name: string;
    joinedAt: string;
    leftAt: string | null;
    presence: JamPresence | null;
    /** Null se a pessoa cancelou o treino. */
    session: {
        id: number;
        completedAt: string | null;
        /** A prescrição da sessão dela, que pode diferir da do host. */
        exercises: { exerciseId: number; name: string; targetSets: number; skipped: boolean }[];
        /** Do rascunho enquanto a sessão está aberta; das séries salvas depois de concluída. */
        sets: { exerciseId: number; setNumber: number; actualReps: number; actualWeight: number | null }[];
    } | null;
}

/** Onde a pessoa está na jam, para a faixa e a lista de participantes. */
export type JamMemberProgress =
    | { kind: "TRAINING"; exerciseId: number; exerciseName: string; setsDone: number; targetSets: number }
    | { kind: "DONE" }
    | { kind: "IDLE" };

/**
 * A presença diz onde a pessoa está; sem ela (app fechado, presença ainda não enviada), o
 * primeiro exercício com série a fazer é o palpite mais provável. Sessão cancelada ou sem
 * nada a fazer vira IDLE; sessão concluída vira DONE.
 */
export const jamMemberProgress = (member: JamMemberState): JamMemberProgress => {
    const session = member.session;

    if (!session) return { kind: "IDLE" };
    if (session.completedAt) return { kind: "DONE" };

    const setsDoneOf = (exerciseId: number) => session.sets.filter((set) => set.exerciseId === exerciseId).length;
    const presentId = member.presence?.exerciseId ?? null;

    const current = (presentId !== null ? session.exercises.find((exercise) => exercise.exerciseId === presentId) : undefined)
        ?? session.exercises.find((exercise) => !exercise.skipped && setsDoneOf(exercise.exerciseId) < exercise.targetSets);

    if (!current) return { kind: "IDLE" };

    return {
        kind: "TRAINING",
        exerciseId: current.exerciseId,
        exerciseName: current.name,
        setsDone: setsDoneOf(current.exerciseId),
        targetSets: current.targetSets,
    };
};

/**
 * De quem é a vez neste exercício, lendo o estado da jam. Só quem continua na jam e tem
 * treino aberto entra no rodízio; "está aqui" é o exercício onde a pessoa está (presença ou
 * palpite pelas séries). Não olha o modo: quem chama decide se o exercício está em revezamento.
 */
export const jamTurnForExercise = (state: Pick<JamState, "members">, exerciseId: number): number | null => {
    const candidates: JamTurnCandidate[] = state.members
        .filter((member) => member.leftAt === null && member.session !== null && member.session.completedAt === null)
        .map((member) => {
            const progress = jamMemberProgress(member);
            const isHere = progress.kind === "TRAINING" && progress.exerciseId === exerciseId;

            return {
                userId: member.userId,
                joinedAt: new Date(member.joinedAt).getTime(),
                isHere,
                setsDone: isHere ? progress.setsDone : 0,
                targetSets: isHere ? progress.targetSets : 0,
            };
        });

    return resolveJamTurn(candidates);
};

/** Carga da última série da pessoa neste exercício. Null sem série ou sem carga registrada. */
export const jamLastWeight = (member: JamMemberState, exerciseId: number): number | null => {
    const sets = (member.session?.sets ?? []).filter((set) => set.exerciseId === exerciseId);
    const last = sets.reduce<(typeof sets)[number] | null>(
        (latest, set) => (latest === null || set.setNumber > latest.setNumber ? set : latest),
        null
    );

    return last?.actualWeight ?? null;
};

/** Equipamentos em que a carga vai em anilhas dos dois lados. */
const PLATE_LOADED_EQUIPMENT = new Set(["BARBELL", "SMITH", "EZ_BAR"]);

export const isPlateLoaded = (equipment: string | null | undefined): boolean =>
    equipment !== null && equipment !== undefined && PLATE_LOADED_EQUIPMENT.has(equipment);

/**
 * O que mexer na barra para ir da carga de quem acabou de usar para a sua. Por lado, porque é
 * assim que se carrega. Null quando não há o que trocar.
 */
export const jamPlateSwap = (fromKg: number, toKg: number): { action: "ADD" | "REMOVE"; perSideKg: number } | null => {
    // Arredonda a meio grama para fugir de 0.30000000000000004.
    const perSideKg = Math.round((Math.abs(toKg - fromKg) / 2) * 1000) / 1000;

    if (perSideKg === 0) return null;

    return { action: toKg > fromKg ? "ADD" : "REMOVE", perSideKg };
};
