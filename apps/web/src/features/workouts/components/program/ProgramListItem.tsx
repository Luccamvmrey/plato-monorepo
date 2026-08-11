import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button.tsx";
import { Check, Power, SquarePen, Trash2 } from "lucide-react";
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
};

const ProgramListItem = ({
    program,
    isPending,
    onActivate,
    onDeactivate,
    onEdit,
    onDelete,
}: ProgramListItemProps) => (
    <Card className={cn("bg-card shadow-none", program.isActive && "border-primary/40")}>
        <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                    <CardTitle className="text-lg font-medium tracking-tight truncate">
                        {program.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        {program.programWorkout.length}
                        {program.programWorkout.length === 1 ? " treino" : " treinos"}
                    </p>
                </div>
                {program.isActive && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 shrink-0">
                        Ativo
                    </span>
                )}
            </div>
        </CardHeader>

        <CardContent className="pb-2">
            <ol className="flex flex-col gap-1">
                {program.programWorkout.map((entry, index) => (
                    <li key={entry.id} className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-muted-foreground tabular-nums w-4 shrink-0">
                            {index + 1}
                        </span>
                        <span className="flex-1 truncate text-foreground/90 tracking-tight">
                            {entry.workout.name}
                        </span>
                    </li>
                ))}
            </ol>
        </CardContent>

        <CardFooter className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-border/50">
            {/* gap-2 é o mínimo: com .tap-target cada botão tem 44px de alvo sobre
                36px visuais, e 4px de gap faria os alvos se invadirem. */}
            <div className="flex gap-2">
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

            <Button
                onClick={program.isActive ? onDeactivate : onActivate}
                disabled={isPending}
                variant={program.isActive ? "secondary" : "default"}
                className="h-9 px-4 gap-2 font-medium tracking-tight relative tap-target"
            >
                {isPending
                    ? <Spinner data-icon="inline-start" />
                    : program.isActive
                        ? <Power data-icon="inline-start" />
                        : <Check data-icon="inline-start" />}
                {program.isActive ? "Desativar" : "Ativar"}
            </Button>
        </CardFooter>
    </Card>
);

export default ProgramListItem;
