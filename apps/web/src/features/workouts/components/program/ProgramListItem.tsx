import { Check, Share2, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import DeletionAlertDialog from "@/core/components/DeletionAlertDialog.tsx";
import type { ProgramWithWorkouts } from "@/features/workouts/program.types.ts";
import { cn } from "@/lib/utils.ts";

type ProgramListItemProps = {
    program: ProgramWithWorkouts;
    isPending?: boolean;
    onActivate: () => void;
    onDeactivate: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onShare: () => void;
};

const ProgramListItem = ({
    program,
    isPending,
    onActivate,
    onDeactivate,
    onEdit,
    onDelete,
    onShare,
}: ProgramListItemProps) => (
    <section className={cn(
        "rounded-xl bg-card flex flex-col gap-3 p-4",
        program.isActive ? "border-2 border-primary/40" : "border border-border"
    )}>
        <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
                {program.isActive && (
                    <p className="flex items-center gap-1 text-[13px] font-medium text-primary mb-1">
                        <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                        Em uso
                    </p>
                )}
                <h2 className="text-[20px] font-semibold tracking-[-0.02em] leading-tight">{program.name}</h2>
                {program.description && (
                    <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
                )}
            </div>

            {/* gap-2 é o mínimo: com .tap-target cada botão tem 44px de alvo sobre
                36px visuais, e 4px de gap faria os alvos se invadirem. */}
            <div className="flex gap-2 shrink-0 -mr-1 -mt-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground relative tap-target"
                    onClick={onShare}
                    aria-label="Compartilhar programa"
                >
                    <Share2 data-icon="inline" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground relative tap-target"
                    onClick={onEdit}
                    aria-label="Editar programa"
                >
                    <SquarePen data-icon="inline" />
                </Button>
                <DeletionAlertDialog onConfirm={onDelete}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground relative tap-target"
                        aria-label="Excluir programa"
                    >
                        <Trash2 data-icon="inline" />
                    </Button>
                </DeletionAlertDialog>
            </div>
        </div>

        {/* A rotação em blocos numerados: mesma linguagem das séries na sessão. */}
        <ol className="flex flex-col gap-1.5">
            {program.programWorkout.map((entry, index) => (
                <li key={entry.id} className="flex items-center gap-3 text-[14px]">
                    <span className="size-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-[13px] font-medium tabular-nums shrink-0">
                        {index + 1}
                    </span>
                    <span className="flex-1 min-w-0 truncate">{entry.workout.name}</span>
                </li>
            ))}
        </ol>

        <Button
            onClick={program.isActive ? onDeactivate : onActivate}
            disabled={isPending}
            variant={program.isActive ? "ghost" : "secondary"}
            className={cn("w-full h-11 font-medium", program.isActive && "text-muted-foreground")}
        >
            {isPending && <Spinner data-icon="inline-start" />}
            {program.isActive ? "Parar de usar" : "Usar este programa"}
        </Button>
    </section>
);

export default ProgramListItem;
