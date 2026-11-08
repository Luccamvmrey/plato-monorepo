import type { Workout, WorkoutSession } from "@/features/workouts/workout.types.ts";
import { WorkoutTimer } from "./components/WorkoutTimer";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ActiveWorkoutHeaderProps = {
    workout?: Workout;
    session?: WorkoutSession;
    onBackClick: () => void;
    onCancelClick: () => void;
    isCancelPending: boolean;
};

const ActiveWorkoutHeader = ({ workout, session, onBackClick, onCancelClick, isCancelPending }: ActiveWorkoutHeaderProps) => {
    if (!workout || !session) return null;

    return (
        <div className="h-12 flex items-center justify-between gap-2 sticky top-0 z-10 bg-background">
            <button
                onClick={onBackClick}
                aria-label={`Sair da sessão (o treino continua aberto): ${workout.name}`}
                className="flex items-center gap-1.5 min-w-0"
            >
                <ChevronLeft className="size-5 text-muted-foreground flex-shrink-0" />
                <span className="text-base font-medium tracking-[-0.02em] text-foreground truncate">
                    {workout.name}
                </span>
            </button>
            <div className="flex items-center gap-1 flex-shrink-0">
                <WorkoutTimer startedAt={session.startedAt} />
                {/* Cancelar saiu do rodapé: é raro, destrutivo e não precisa
                    disputar espaço com o descanso. */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            aria-label="Opções do treino"
                            className="relative tap-target text-muted-foreground p-1 hover:text-foreground transition-colors"
                        >
                            <MoreHorizontal className="size-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onSelect={onCancelClick}
                            disabled={isCancelPending}
                            className="text-destructive focus:text-destructive"
                        >
                            Cancelar treino
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default ActiveWorkoutHeader;
