import { useLocation } from "wouter";
import { ChevronRight, ListOrdered } from "lucide-react";
import { path } from "@/core/constants/path.ts";
import { useActiveProgram } from "@/features/workouts/hooks/useActiveProgram.ts";

/**
 * Caminho para Programas enquanto a rotação ainda não aparece na lista de treinos.
 *
 * Com um programa em uso, o card do próximo treino e a seção da rotação já cumprem esse
 * papel. Discreto de propósito: treino avulso continua sendo um jeito legítimo de usar
 * o app.
 */
const ActiveProgramBanner = () => {
    const [, navigate] = useLocation();
    const { data, isLoading } = useActiveProgram();

    if (isLoading || data?.next) return null;

    return (
        <button
            type="button"
            onClick={() => navigate(path.PROGRAMS)}
            className="w-full min-h-12 flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border text-left transition-colors hover:bg-muted/40"
        >
            <ListOrdered className="size-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-[14px] text-muted-foreground">
                {data ? "Adicione treinos à sua rotação" : "Organize seus treinos numa rotação"}
            </span>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </button>
    );
};

export default ActiveProgramBanner;
