import { Info } from "lucide-react";
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
        <section className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border">
            <h2 className="flex items-start gap-2 text-[14px] font-medium">
                <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                Movimentos repetidos
            </h2>

            {groups.map((group) => (
                <div key={group.key} className="flex flex-col gap-1 pl-6">
                    <p className="text-[13px] text-muted-foreground">{group.label}: toque para ver alternativas</p>
                    <div className="flex flex-wrap gap-x-4">
                        {group.drafts.map((draft) => (
                            <button
                                key={draft.instanceId}
                                type="button"
                                className="min-h-9 text-left text-[14px] text-primary"
                                onClick={() => onInspect(draft)}
                            >
                                {draft.exercise.name}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
};

export default RedundancyNotice;
