import { Users } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { InlineErrorBanner } from "@/core/components/InlineErrorBanner";
import { cn } from "@/lib/utils.ts";
import { TrackingModeChoiceSheet } from "@/features/workouts/components/workout-list/TrackingModeChoiceSheet.tsx";
import { useJamJoinActions, type JamWorkoutChoice } from "@/features/jam/hooks/useJamJoinActions.ts";

const ChoiceRow = ({ checked, title, description, onSelect }: {
    checked: boolean;
    title: string;
    description: string;
    onSelect: () => void;
}) => (
    <button
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={onSelect}
        className={cn(
            "flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-colors",
            checked ? "border-primary bg-card" : "border-border bg-card"
        )}
    >
        <span
            aria-hidden
            className={cn(
                "size-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                checked ? "border-primary" : "border-muted-foreground/40"
            )}
        >
            {checked && <span className="size-2.5 rounded-full bg-primary" />}
        </span>
        <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-medium truncate">{title}</span>
            <span className="block text-[13px] text-muted-foreground">{description}</span>
        </span>
    </button>
);

/** Escolha do treino e o botão de entrar. Só existe com login. */
export const JamJoinActions = ({ token, hostName }: { token: string; hostName: string }) => {
    const {
        isReady,
        isBetaEnabled,
        candidates,
        selected,
        setChoice,
        blockingWorkoutName,
        goToActiveWorkout,
        isJoining,
        error,
        handleJoin,
        isChoosingMode,
        handleChooseMode,
        cancelChoosingMode,
    } = useJamJoinActions(token);

    const select = (choice: JamWorkoutChoice) => () => setChoice(choice);

    return (
        <>
            {candidates.length > 0 && (
                <section aria-label="Qual treino usar" className="flex flex-col gap-2">
                    <h2 className="text-[13px] font-medium text-muted-foreground">Você já tem este treino</h2>
                    <div role="radiogroup" className="flex flex-col gap-2">
                        {candidates.map((candidate) => (
                            <ChoiceRow
                                key={candidate.id}
                                checked={selected === candidate.id}
                                title={`Usar meu ${candidate.name}`}
                                description={candidate.isActive
                                    ? "Seu histórico de cargas continua num treino só"
                                    : "Está arquivado; seu histórico continua num treino só"}
                                onSelect={select(candidate.id)}
                            />
                        ))}
                        <ChoiceRow
                            checked={selected === "copy"}
                            title={`Usar o treino de ${hostName}`}
                            description="Uma cópia fica guardada nos seus treinos, arquivada"
                            onSelect={select("copy")}
                        />
                    </div>
                </section>
            )}

            {blockingWorkoutName && (
                <div className="flex flex-col gap-2 rounded-xl bg-card border border-border p-4">
                    <p className="text-[14px]">
                        Você tem um treino em andamento ({blockingWorkoutName}). Conclua ou descarte para entrar na jam.
                    </p>
                    <Button variant="outline" onClick={goToActiveWorkout} className="h-11 font-medium self-start">
                        Ir para o treino
                    </Button>
                </div>
            )}

            {error && <InlineErrorBanner message={error} />}

            {!isBetaEnabled && isReady && (
                <p className="text-[13px] text-muted-foreground">
                    A jam é uma novidade em teste. Entrar liga "Testar novidades" no seu perfil, e dá
                    para desligar quando quiser.
                </p>
            )}

            <div aria-hidden className="h-24" />

            <div className="fixed inset-x-0 bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                <div className="mx-auto max-w-lg">
                    <Button
                        onClick={handleJoin}
                        disabled={!isReady || isJoining || !!blockingWorkoutName}
                        className="w-full h-[52px] gap-2 text-[15px] font-medium tracking-[-0.01em]"
                    >
                        {isJoining ? <Spinner data-icon="inline-start" /> : <Users data-icon="inline-start" />}
                        {isBetaEnabled ? "Entrar na jam" : "Ativar novidades e entrar"}
                    </Button>
                </div>
            </div>

            <TrackingModeChoiceSheet open={isChoosingMode} onCancel={cancelChoosingMode} onChoose={handleChooseMode} />
        </>
    );
};
