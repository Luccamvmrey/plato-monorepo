import { Info } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import type { RedundantGroup } from "@/features/workouts/utils/movement.ts";
import type { WorkoutExerciseDraft } from "@/features/workouts/stores/workout-editor.store.ts";

type RedundancyNoticeProps = {
    groups: RedundantGroup[];
    onInspect: (draft: WorkoutExerciseDraft) => void;
};

/**
 * Aviso de padrão de movimento repetido no mesmo treino.
 *
 * Informativo, nunca bloqueante, e o tom é deliberado: três roscas no mesmo treino
 * pode ser exatamente o que o usuário quis. O que o app pode fazer é tornar o fato
 * visível — ele é invisível hoje porque, por grupo muscular, dois puxares horizontais
 * e um treino de costas bem variado são a mesma coisa.
 */
const RedundancyNotice = ({ groups, onInspect }: RedundancyNoticeProps) => {
    if (groups.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[13px] text-muted-foreground">
                    {groups.length === 1
                        ? "Dois exercícios deste treino repetem o mesmo padrão de movimento."
                        : `${groups.length} padrões de movimento aparecem mais de uma vez neste treino.`}
                </p>
            </div>

            <div className="flex flex-col gap-2 pl-7">
                {groups.map((group) => (
                    <div key={group.key} className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {group.label}
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {group.drafts.map((draft) => (
                                <Button
                                    key={draft.instanceId}
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 text-xs font-normal relative tap-target"
                                    onClick={() => onInspect(draft)}
                                >
                                    {draft.exercise.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RedundancyNotice;
