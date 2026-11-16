import { describe, expect, it } from "vitest";
import { jamExerciseMode, jamMemberProgress, pickJamEntryExercise, resolveJamTurn, type JamMemberState, type JamTurnCandidate } from "./jam";

const member = (userId: number, setsDone: number, overrides: Partial<JamTurnCandidate> = {}): JamTurnCandidate => ({
    userId,
    joinedAt: userId * 1000,
    isHere: true,
    setsDone,
    targetSets: 4,
    ...overrides,
});

describe("resolveJamTurn", () => {
    it("é a vez de quem fez menos séries", () => {
        expect(resolveJamTurn([member(1, 2), member(2, 1), member(3, 2)])).toBe(2);
    });

    it("empate vai para quem entrou antes", () => {
        expect(resolveJamTurn([member(3, 1), member(1, 2), member(2, 1)])).toBe(2);
    });

    it("passa a vez quando a pessoa registra a série", () => {
        const before = [member(1, 2), member(2, 1), member(3, 1)];
        expect(resolveJamTurn(before)).toBe(2);

        const after = [member(1, 2), member(2, 2), member(3, 1)];
        expect(resolveJamTurn(after)).toBe(3);
    });

    it("quem terminou as séries sai do rodízio", () => {
        expect(resolveJamTurn([member(1, 4), member(2, 3), member(3, 3)])).toBe(2);
    });

    it("quem não está no exercício (pulou ou ainda não chegou) sai do rodízio", () => {
        expect(resolveJamTurn([member(1, 0, { isHere: false }), member(2, 2), member(3, 1)])).toBe(3);
    });

    it("com uma pessoa só no rodízio não há vez", () => {
        expect(resolveJamTurn([member(1, 2), member(2, 4)])).toBeNull();
        expect(resolveJamTurn([member(1, 0), member(2, 0, { isHere: false })])).toBeNull();
    });

    it("todos no fim: ninguém tem vez", () => {
        expect(resolveJamTurn([member(1, 4), member(2, 4)])).toBeNull();
    });

    it("respeita a meta de cada um, que pode ser diferente", () => {
        expect(resolveJamTurn([member(1, 3, { targetSets: 3 }), member(2, 3), member(3, 3)])).toBe(2);
    });
});

describe("pickJamEntryExercise", () => {
    it("entra no exercício mais comum do grupo", () => {
        const others = [
            { exerciseId: 10, isHost: true },
            { exerciseId: 20, isHost: false },
            { exerciseId: 20, isHost: false },
        ];

        expect(pickJamEntryExercise(others, [10, 20, 30])).toBe(20);
    });

    it("empate vai para o exercício do host", () => {
        const others = [
            { exerciseId: 20, isHost: false },
            { exerciseId: 10, isHost: true },
        ];

        expect(pickJamEntryExercise(others, [10, 20])).toBe(10);
    });

    it("ignora exercício que a pessoa não tem no treino dela", () => {
        const others = [
            { exerciseId: 99, isHost: true },
            { exerciseId: 99, isHost: false },
            { exerciseId: 20, isHost: false },
        ];

        expect(pickJamEntryExercise(others, [10, 20])).toBe(20);
    });

    it("sem ninguém treinando, começa do início", () => {
        expect(pickJamEntryExercise([], [10, 20])).toBeNull();
        expect(pickJamEntryExercise([{ exerciseId: null, isHost: true }], [10])).toBeNull();
    });
});

describe("jamExerciseMode", () => {
    it("lê o modo pelo exerciseId e assume PARALLEL no resto", () => {
        const modes = { "10": "ALTERNATE", "20": "PARALLEL", "30": "lixo" };

        expect(jamExerciseMode(modes, 10)).toBe("ALTERNATE");
        expect(jamExerciseMode(modes, 20)).toBe("PARALLEL");
        expect(jamExerciseMode(modes, 30)).toBe("PARALLEL");
        expect(jamExerciseMode(modes, 40)).toBe("PARALLEL");
        expect(jamExerciseMode(null, 10)).toBe("PARALLEL");
    });
});

describe("jamMemberProgress", () => {
    const base = (overrides: Partial<JamMemberState> = {}): JamMemberState => ({
        userId: 1,
        name: "Ana",
        joinedAt: "2026-11-16T10:00:00.000Z",
        leftAt: null,
        presence: null,
        session: {
            id: 1,
            completedAt: null,
            exercises: [
                { exerciseId: 10, name: "Supino", targetSets: 2, skipped: false },
                { exerciseId: 20, name: "Crucifixo", targetSets: 3, skipped: false },
            ],
            sets: [],
        },
        ...overrides,
    });

    const set = (exerciseId: number, setNumber: number) => ({ exerciseId, setNumber, actualReps: 10, actualWeight: 50 });

    it("usa o exercício da presença", () => {
        expect(jamMemberProgress(base({ presence: { exerciseId: 20, restEndsAt: null } }))).toEqual({
            kind: "TRAINING", exerciseId: 20, exerciseName: "Crucifixo", setsDone: 0, targetSets: 3,
        });
    });

    it("sem presença, deduz o primeiro exercício com série a fazer", () => {
        const member = base();
        member.session!.sets = [set(10, 1), set(10, 2), set(20, 1)];

        expect(jamMemberProgress(member)).toMatchObject({ exerciseId: 20, setsDone: 1 });
    });

    it("sem presença, pula o exercício pulado", () => {
        const member = base();
        member.session!.exercises[0].skipped = true;

        expect(jamMemberProgress(member)).toMatchObject({ exerciseId: 20 });
    });

    it("presença num exercício que a sessão não tem cai no palpite", () => {
        expect(jamMemberProgress(base({ presence: { exerciseId: 99, restEndsAt: null } }))).toMatchObject({ exerciseId: 10 });
    });

    it("sessão concluída é DONE e sessão cancelada é IDLE", () => {
        const done = base();
        done.session!.completedAt = "2026-11-16T11:00:00.000Z";

        expect(jamMemberProgress(done)).toEqual({ kind: "DONE" });
        expect(jamMemberProgress(base({ session: null }))).toEqual({ kind: "IDLE" });
    });

    it("tudo feito e sem presença é IDLE", () => {
        const member = base();
        member.session!.sets = [set(10, 1), set(10, 2), set(20, 1), set(20, 2), set(20, 3)];

        expect(jamMemberProgress(member)).toEqual({ kind: "IDLE" });
    });
});
