import { JAM_MAX_MEMBERS, type JamExerciseModeValue } from "@plato/shared";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { cn } from "@/lib/utils.ts";
import type { ActiveJam } from "@/features/jam/hooks/useActiveJam.ts";
import { JamAvatar } from "./JamAvatar.tsx";
import { describeJamProgress } from "@/features/jam/utils/jam-progress.ts";
import { JamInvite } from "./JamInvite.tsx";

const MODES: { value: JamExerciseModeValue; label: string; description: string }[] = [
    { value: "PARALLEL", label: "Juntos", description: "Cada um na sua estação, no seu ritmo." },
    { value: "ALTERNATE", label: "Revezando", description: "Mesmo aparelho: terminou a série, a vez passa para o próximo." },
];

const SectionTitle = ({ children, id }: { children: string; id?: string }) => (
    <h3 id={id} className="text-[13px] font-medium text-muted-foreground tabular-nums">{children}</h3>
);

/** Tudo da jam que não cabe na faixa: quem está, o modo do exercício, o convite e sair. */
export const JamSheet = ({ activeJam }: { activeJam: ActiveJam }) => {
    const {
        jam,
        participants,
        activeExerciseId,
        activeExerciseName,
        currentMode,
        setCurrentMode,
        isChangingMode,
        leave,
        isLeaving,
        isSheetOpen,
        closeSheet,
    } = activeJam;

    if (!jam) return null;

    const currentDescription = MODES.find((mode) => mode.value === currentMode)?.description;

    return (
        <Sheet open={isSheetOpen} onOpenChange={(open) => !open && closeSheet()}>
            <SheetContent
                side="bottom"
                onOpenAutoFocus={(event) => event.preventDefault()}
                className="rounded-t-2xl max-h-[88dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
                <SheetHeader className="pb-0 pr-12">
                    <SheetTitle className="text-[20px] font-semibold tracking-[-0.02em]">Jam</SheetTitle>
                    <SheetDescription className="text-[14px]">{jam.workout.name}</SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-5 px-4">
                    <section aria-label="Quem está na jam" className="flex flex-col gap-1">
                        <SectionTitle>{`${participants.length} de ${JAM_MAX_MEMBERS} pessoas`}</SectionTitle>
                        <ul>
                            {participants.map((participant) => (
                                <li key={participant.userId} className="flex items-center gap-3 py-2.5 border-t border-border first:border-t-0">
                                    <JamAvatar
                                        name={participant.name}
                                        isHighlighted={!participant.isMe
                                            && participant.progress.kind === "TRAINING"
                                            && participant.progress.exerciseId === activeExerciseId}
                                    />
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[14px] truncate">
                                            {participant.name}
                                            {participant.isMe && <span className="text-muted-foreground"> (você)</span>}
                                        </span>
                                        <span className="block text-[13px] text-muted-foreground truncate tabular-nums">
                                            {describeJamProgress(participant.progress)}
                                        </span>
                                    </span>
                                    {participant.isHost && <span className="text-[13px] text-muted-foreground shrink-0">Criou a jam</span>}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {currentMode && activeExerciseName && (
                        <section aria-labelledby="jam-mode-label" className="flex flex-col gap-2">
                            <SectionTitle id="jam-mode-label">{`Em ${activeExerciseName}`}</SectionTitle>
                            <div role="radiogroup" aria-labelledby="jam-mode-label" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                                {MODES.map((mode) => (
                                    <button
                                        key={mode.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={currentMode === mode.value}
                                        disabled={isChangingMode}
                                        onClick={() => currentMode !== mode.value && setCurrentMode(mode.value)}
                                        className={cn(
                                            "h-10 rounded-md text-[14px] font-medium transition-colors",
                                            currentMode === mode.value ? "bg-card text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[13px] text-muted-foreground">{currentDescription} Vale para todos da jam.</p>
                        </section>
                    )}

                    {participants.length < JAM_MAX_MEMBERS && (
                        <section aria-label="Chamar mais alguém" className="flex flex-col gap-2">
                            <SectionTitle>Chamar mais alguém</SectionTitle>
                            <JamInvite jam={jam} compact />
                        </section>
                    )}

                    <div className="flex flex-col gap-1 pt-1 border-t border-border">
                        <Button
                            variant="ghost"
                            onClick={leave}
                            disabled={isLeaving}
                            className="h-11 gap-2 self-start -ml-2 px-2 text-destructive hover:text-destructive font-medium"
                        >
                            {isLeaving ? <Spinner data-icon="inline-start" /> : <LogOut data-icon="inline-start" />}
                            Sair da jam
                        </Button>
                        <p className="text-[13px] text-muted-foreground">Seu treino continua, só que sozinho.</p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
