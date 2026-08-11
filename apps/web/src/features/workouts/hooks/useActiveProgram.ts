import { useQuery } from "@tanstack/react-query";
import { ProgramService } from "@/features/workouts/services/program.service.ts";

/**
 * Hook slim para o programa ativo e o treino sugerido.
 *
 * Separado de `usePrograms` de propósito: a Biblioteca só precisa desta query, e
 * montar o hook completo ali traria as cinco mutations junto — o mesmo motivo pelo
 * qual `useActiveSession` existe ao lado de `useWorkoutSession`.
 *
 * A key `["active-program"]` é invalidada ao finalizar sessão (nos DOIS lugares do
 * ciclo de finalização) e por qualquer mutation de programa.
 */
export const useActiveProgram = () => {
    return useQuery({
        queryKey: ["active-program"],
        queryFn: ProgramService.getActiveNext,
    });
};
