import { useLocation } from "wouter";
import { ChevronRight, ListOrdered } from "lucide-react";
import { path } from "@/core/constants/path.ts";
import { useActiveProgram } from "@/features/workouts/hooks/useActiveProgram.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

/**
 * Resumo do programa ativo no topo da Biblioteca.
 *
 * De propósito NÃO tem botão de iniciar: quem inicia treino é o card da lista
 * abaixo, e duplicar essa ação aqui duplicaria também o tratamento de sessão já
 * ativa, de conflito e de retomada. Aqui é só orientação — qual é o próximo e onde
 * ele cai no ciclo.
 */
const ActiveProgramBanner = () => {
    const [, navigate] = useLocation();
    const { data, isLoading } = useActiveProgram();

    if (isLoading) return <Skeleton className="h-[68px] w-full rounded-xl" />;

    // Sem programa ativo o convite aparece, mas discreto: montar um programa é
    // opcional, e treino avulso continua sendo um jeito legítimo de usar o app.
    if (!data) {
        return (
            <button
                onClick={() => navigate(path.PROGRAMS)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border text-left transition-colors hover:bg-muted/40"
            >
                <ListOrdered className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-[13px] text-muted-foreground">
                    Organize seus treinos numa rotação
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
        );
    }

    return (
        <button
            onClick={() => navigate(path.PROGRAMS)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-left transition-colors hover:bg-primary/10"
        >
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                        {data.program.name}
                    </span>
                    {data.position !== null && (
                        <span className="text-[10px] font-medium text-muted-foreground tabular-nums shrink-0">
                            {data.position} de {data.total}
                        </span>
                    )}
                </div>
                <span className="text-sm font-medium tracking-tight truncate">
                    {data.next ? `Próximo: ${data.next.workout.name}` : "Programa sem treinos"}
                </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
    );
};

export default ActiveProgramBanner;
